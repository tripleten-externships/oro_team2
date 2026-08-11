const VALID_ANSWERS = Object.freeze({
  goal: new Set(['lump', 'income', 'lower', 'faster']),
  longTermStay: new Set(['yes', 'prob', 'open', 'soon']),
  paymentCapacity: new Set(['yes', 'min', 'no']),
  priority: new Set(['cost', 'cash', 'equity', 'simple']),
})

const ANSWER_KEYS = Object.freeze(Object.keys(VALID_ANSWERS))

function validateAnswers(answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new TypeError('answers must be an object')
  }

  for (const key of ANSWER_KEYS) {
    const value = answers[key]

    if (!VALID_ANSWERS[key].has(value)) {
      throw new RangeError(`answers.${key} has an unsupported value`)
    }
  }

  return answers
}

function addScore(scores, productIds, points) {
  for (const productId of productIds) {
    scores.set(productId, scores.get(productId) + points)
  }
}

function scoreProducts(products, answers) {
  validateAnswers(answers)

  const scores = new Map(products.map((product) => [product.id, 0]))

  if (answers.longTermStay === 'soon') {
    addScore(scores, ['sale-leaseback'], 3)
    addScore(scores, ['co-ownership'], 2)
  }

  if (answers.longTermStay === 'yes' || answers.longTermStay === 'prob') {
    addScore(scores, ['sale-leaseback'], -3)
    addScore(scores, ['co-ownership'], -1)
  }

  if (answers.paymentCapacity === 'no') {
    addScore(scores, ['reverse-mortgage'], 3)
    addScore(scores, ['home-equity-investment'], 3)
    addScore(scores, ['co-ownership'], 2)
    addScore(scores, ['sale-leaseback'], 1)
    addScore(scores, ['heloc', 'heloan', 'cash-out-refinance'], -2)
  }

  if (answers.paymentCapacity === 'min') {
    addScore(scores, ['home-equity-investment'], 1)
    addScore(scores, ['reverse-mortgage'], 1)
    addScore(scores, ['heloc'], 1)
  }

  if (answers.paymentCapacity === 'yes') {
    addScore(scores, ['heloc', 'heloan', 'cash-out-refinance'], 2)
  }

  if (answers.goal === 'lump') {
    addScore(scores, ['heloan', 'home-equity-investment'], 2)
    addScore(scores, ['heloc', 'cash-out-refinance', 'sale-leaseback'], 1)
  }

  if (answers.goal === 'income') {
    addScore(scores, ['reverse-mortgage'], 3)
    addScore(scores, ['heloc'], 1)
  }

  if (answers.goal === 'lower') {
    addScore(scores, ['cash-out-refinance'], 3)
    addScore(scores, ['heloc'], -1)
  }

  if (answers.goal === 'faster') {
    addScore(scores, ['cash-out-refinance'], 2)
  }

  if (answers.priority === 'cost') {
    addScore(scores, ['heloc', 'heloan'], 2)
    addScore(scores, ['reverse-mortgage', 'home-equity-investment'], -1)
  }

  if (answers.priority === 'cash') {
    addScore(scores, ['sale-leaseback'], 2)
    addScore(scores, ['reverse-mortgage', 'cash-out-refinance'], 1)
  }

  if (answers.priority === 'equity') {
    addScore(scores, ['heloc', 'heloan', 'cash-out-refinance'], 1)
    addScore(scores, ['home-equity-investment', 'co-ownership'], -2)
    addScore(scores, ['sale-leaseback'], -3)
  }

  if (answers.priority === 'simple') {
    addScore(scores, ['cash-out-refinance', 'heloan'], 1)
  }

  return products
    .map((product, index) => ({
      product,
      score: product.id === 'reverse-mortgage' && !product.eligible
        ? -99
        : scores.get(product.id),
      index,
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 3)
    .map(({ product, score }) => ({ product, score }))
}

export { scoreProducts }
