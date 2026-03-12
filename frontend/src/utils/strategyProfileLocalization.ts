import type { StrategyProfile } from '../api/backtest'
import { getTraderProfileOverride } from '../domain/traderProfiles'

type StrategyProfileOverride = Pick<StrategyProfile, 'display_name' | 'short_name' | 'title' | 'description'>

export function localizeStrategyProfile(profile: StrategyProfile): StrategyProfile {
  const override: StrategyProfileOverride | undefined =
    profile.strategy_name === 'rule-based-stage2'
      ? {
          display_name: 'ベースライン Stage2',
          short_name: 'ベースライン',
          title: 'Stage2 トレンド基準戦略',
          description: '比較の基準に使う Stage2 の標準戦略です。',
        }
      : getTraderProfileOverride(profile.strategy_name)
  if (!override) return profile
  return {
    ...profile,
    ...override,
  }
}

export function resolveStrategyDisplayName(strategyName: string | null | undefined, profiles: StrategyProfile[]) {
  if (!strategyName) return null
  return profiles.find((profile) => profile.strategy_name === strategyName)?.display_name ?? strategyName
}

export function resolveRuleProfileDisplayName(ruleProfile: string | null | undefined, profiles: StrategyProfile[]) {
  if (!ruleProfile) return null
  return profiles.find((profile) => profile.rule_profile === ruleProfile)?.title ?? ruleProfile
}
