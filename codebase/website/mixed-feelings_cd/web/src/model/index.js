// ============================================================================
//  THE SWAP POINT FOR YOUR TEAM'S MODEL
// ----------------------------------------------------------------------------
//  Every model is a function:  predict(profile) -> Prediction
//
//    profile.levels  { Classical: 0-3, Country: 0-3, ... }   <- same scale as the
//                    survey's Never(0) / Rarely(1) / Sometimes(2) / Very frequently(3)
//    profile.shares  { Classical: 0-1, ... }                 <- share of listening
//
//    Prediction = {
//      scores:   { Anxiety, Depression, Insomnia, OCD }   // 0-10
//      baseline: { Anxiety, Depression, Insomnia, OCD }   // whole-survey average
//      improveShare?: number   // 0-1, share saying music improves their mood
//      method:   string        // one line shown under the chart
//    }
//
//  To plug in a new model:
//    * Linear/logistic-style: export coefficients to src/data/linear_model.json
//      (same format) and set ACTIVE_MODEL = 'linear'. No code changes.
//    * Anything else: add a file next to knn.js, register it in MODELS below.
// ============================================================================
import survey from '../data/survey.json'
import linearModel from '../data/linear_model.json'
import { knnPredict } from './knn.js'
import { linearPredict } from './linear.js'

export const ACTIVE_MODEL = 'knn'

export const MODELS = {
  knn: (profile) => knnPredict(profile, survey, { k: 50 }),
  linear: (profile) => linearPredict(profile, linearModel, survey),
}

export const CONDITIONS = survey.conditions
export const SURVEY_N = survey.n

export function predict(profile, model = ACTIVE_MODEL) {
  return MODELS[model](profile)
}
