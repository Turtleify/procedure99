import type { Unit } from '../../../../shared/types'
import { explainUnits } from '../../lib/acronyms'
import { T1_CLOUD, T2_CONTAINERS, T3_ORCHESTRATION } from './t1-t3'
import { T4_TRAFFIC, T5_AUTH } from './t4-t5'
import { T6_POSTGRES, T7_NOSQL, T8_SEARCH } from './t6-t8'
import { T9_REDIS, T10_MESSAGING, T11_SCALING_DATA } from './t9-t11'
import { T12_SHIPPING, T13_OPERATING } from './t12-t13'

/**
 * Tools track: modules that teach real tools hands-on. Each module unlocks
 * when the concept unit(s) in its `requires` are finished.
 */
export const TOOL_TRACK: Unit[] = explainUnits([
  T1_CLOUD,
  T2_CONTAINERS,
  T3_ORCHESTRATION,
  T4_TRAFFIC,
  T5_AUTH,
  T6_POSTGRES,
  T7_NOSQL,
  T8_SEARCH,
  T9_REDIS,
  T10_MESSAGING,
  T11_SCALING_DATA,
  T12_SHIPPING,
  T13_OPERATING
])
