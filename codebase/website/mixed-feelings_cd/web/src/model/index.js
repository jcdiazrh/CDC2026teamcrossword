// ============================================================================
//  WHICH MODEL DRIVES THE RESULTS
// ----------------------------------------------------------------------------
//  Default: 'team', the team's linear regression (Ari's R analysis in
//  musictomentalhealthlm.qmd), stored in src/data/r_model.json.
//    * To use Ari's exact R coefficients: put r_coefficients.csv at the repo root
//      and run `npm run model` (see README).
//  'knn' ("listeners like you") is kept for comparison in the Under the hood panel.
//
//  Every model is a function predict(profile) -> Prediction:
//    profile.levels  { Classical: 0-3, ... }  Never(0) / Rarely(1) / Sometimes(2) / Very frequently(3)
//    Prediction = { scores, baseline, improveShare?, method, kind, ... }
// ============================================================================
import survey from '../data/survey.json'
import teamModel from '../data/r_model.json'
import { knnPredict } from './knn.js'
import { linearPredict } from './linear.js'

export const ACTIVE_MODEL = 'team'

export const MODELS = {
  team: (profile) => linearPredict(profile, teamModel, survey),
  knn: (profile) => knnPredict(profile, survey, { k: 50 }),
}

export const MODEL_NAMES = {
  team: 'Team regression (R)',
  knn: 'Listeners like you (k-nearest)',
}

export const CONDITIONS = survey.conditions
export const SURVEY_N = survey.n

export function predict(profile, model = ACTIVE_MODEL) {
  return MODELS[model](profile)
}
