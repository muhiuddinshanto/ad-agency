import Campaign from '@/models/Campaign';
import DailySpend from '@/models/DailySpend';
import { addDays, getInclusiveDurationInDays, toUtcDay } from './dateMath';

const DAY_MS = 1000 * 60 * 60 * 24;
const BUSINESS_TIME_ZONE_OFFSET_MS = 6 * 60 * 60 * 1000;

export function getBusinessDateKey(dateValue) {
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  const date = new Date(dateValue);
  const businessDate = new Date(date.getTime() + BUSINESS_TIME_ZONE_OFFSET_MS);
  return businessDate.toISOString().split('T')[0];
}

function businessDateKeyToUtcDay(dateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function getStartOfBusinessDayUtc(dateValue) {
  const dateKey = getBusinessDateKey(dateValue);
  return new Date(new Date(`${dateKey}T00:00:00.000Z`).getTime() - BUSINESS_TIME_ZONE_OFFSET_MS);
}

export function getCampaignDailyAmount(campaign) {
  if (campaign.type === 'daily') {
    return campaign.dailyBudget || 0;
  }

  const totalDurationInDays = getInclusiveDurationInDays(campaign.startDate, campaign.endDate);
  return (campaign.totalBudget || 0) / totalDurationInDays;
}

export function getCampaignSpendAmountForDate(campaign, targetDate, now = new Date()) {
  const dailyAmount = getCampaignDailyAmount(campaign);
  const spendDateKey = getBusinessDateKey(targetDate);
  const todayKey = getBusinessDateKey(now);

  if (spendDateKey !== todayKey) {
    return dailyAmount;
  }

  const startOfToday = getStartOfBusinessDayUtc(now);
  const elapsedMs = now.getTime() - startOfToday.getTime();
  const dayProgress = Math.min(1, Math.max(0, elapsedMs / DAY_MS));

  return dailyAmount * dayProgress;
}

export async function createDailySpendForDate(campaign, targetDate, now = new Date()) {
  const spendDate = businessDateKeyToUtcDay(getBusinessDateKey(targetDate));
  const start = toUtcDay(campaign.startDate);
  const end = toUtcDay(campaign.endDate);

  if (campaign.status !== 'running' || spendDate < start || spendDate > end) {
    return { status: 'skipped', amount: 0 };
  }

  const existing = await DailySpend.findOne({
    campaign: campaign._id,
    date: spendDate,
  });

  const amount = getCampaignSpendAmountForDate(campaign, spendDate, now);

  if (existing) {
    if (getBusinessDateKey(spendDate) === getBusinessDateKey(now) && existing.amount !== amount) {
      existing.amount = amount;
      await existing.save();
      return { status: 'updated', amount };
    }

    return { status: 'exists', amount: existing.amount || 0 };
  }

  await DailySpend.create({
    client: campaign.client,
    campaign: campaign._id,
    date: spendDate,
    amount,
  });

  return { status: 'created', amount };
}

export async function backfillCampaignSpend(campaign, targetDate = new Date()) {
  const today = toUtcDay(targetDate);
  const start = toUtcDay(campaign.startDate);
  const end = toUtcDay(campaign.endDate);
  const lastSpendDate = today < end ? today : end;

  if (campaign.status !== 'running' || lastSpendDate < start) {
    return { created: 0 };
  }

  let created = 0;
  let updated = 0;
  for (let date = start; date <= lastSpendDate; date = addDays(date, 1)) {
    const result = await createDailySpendForDate(campaign, date);
    if (result.status === 'created') created += 1;
    if (result.status === 'updated') updated += 1;
  }

  return { created, updated };
}

export async function backfillAllActiveCampaigns(targetDate = new Date()) {
  const campaigns = await Campaign.find({ status: 'running' });
  const results = [];
  const clientsToUpdate = new Set();

  for (const campaign of campaigns) {
    const result = await createDailySpendForDate(campaign, targetDate);
    if (result.status === 'created' || result.status === 'updated') {
      clientsToUpdate.add(campaign.client.toString());
    }
    results.push({ campaign: campaign.name, status: result.status, amount: result.amount });
  }

  return { results, clientsToUpdate };
}

export async function backfillActiveCampaignsThroughDate(targetDate = new Date()) {
  const campaigns = await Campaign.find({ status: 'running' });
  const results = [];
  const clientsToUpdate = new Set();

  for (const campaign of campaigns) {
    const result = await backfillCampaignSpend(campaign, targetDate);
    if (result.created > 0 || result.updated > 0) {
      clientsToUpdate.add(campaign.client.toString());
    }
    results.push({ campaign: campaign.name, created: result.created, updated: result.updated });
  }

  return { results, clientsToUpdate };
}
