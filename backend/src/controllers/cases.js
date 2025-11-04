import { cases } from '../data/cases.js';

export function listCases(_req, res) {
  res.json({ data: cases });
}

export function getCase(req, res, next) {
  const { id } = req.params;
  const found = cases.find((item) => item.id === id);

  if (!found) {
    const error = new Error('Case not found');
    error.status = 404;
    return next(error);
  }

  res.json({ data: found });
}
