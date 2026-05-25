import Campaign from '@/models/Campaign';
import DailySpend from '@/models/DailySpend';
import { addDays, getInclusiveDurationInDays, toUtcDay } from './dateMath';

export function getCampaignDailyAmount(campaign) {
  if (campaign.type === 'daily') {
    return campaign.dailyBudget || 0;
  }

  const totalDurationInDays = getInclusiveDurationInDays(campaign.startDate, campaign.endDate);
  return (campaign.totalBudget || 0) / totalDurationInDays;
}

export async function createDailySpendForDate(campaign, targetDate) {
  const spendDate = toUtcDay(targetDate);
  const start = toUtcDay(campaign.startDate);
  const end = toUtcDay(campaign.endDate);

  if (campaign.status !== 'running' || spendDate < start || spendDate > end) {
    return { status: 'skipped', amount: 0 };
  }

  const existing = await DailySpend.findOne({
    campaign: campaign._id,
    date: spendDate,
  });

  if (existing) {
    return { status: 'exists', amount: existing.amount || 0 };
  }

  const amount = getCampaignDailyAmount(campaign);
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
  for (let date = start; date <= lastSpendDate; date = addDays(date, 1)) {
    const result = await createDailySpendForDate(campaign, date);
    if (result.status === 'created') created += 1;
  }

  return { created };
}

export async function backfillAllActiveCampaigns(targetDate = new Date()) {
  const campaigns = await Campaign.find({ status: 'running' });
  const results = [];
  const clientsToUpdate = new Set();

  for (const campaign of campaigns) {
    const result = await createDailySpendForDate(campaign, targetDate);
    if (result.status === 'created') {
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
    if (result.created > 0) {
      clientsToUpdate.add(campaign.client.toString());
    }
    results.push({ campaign: campaign.name, created: result.created });
  }

  return { results, clientsToUpdate };
}
