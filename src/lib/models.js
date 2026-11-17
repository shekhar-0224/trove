// Categories with a faithful 3D model (none in the antiques catalogue yet: a seller's 3D scan would plug in here).
const MODELS = {};
export const modelFor = l => MODELS[l?.category] || null;
export const hasModel = l => !!modelFor(l);
export const MODEL_CREDITS = "Photos: The Metropolitan Museum of Art, Open Access (CC0).";
