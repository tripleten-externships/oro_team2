export const DEFAULT_INPUTS = Object.freeze({
  homeValue: 750000,
  mortgageBalance: 350000,
  currentMortgageRate: 4.5,
  yearsRemaining: 22,
  cashNeeded: 100000,
  homeOwnerAge: 55,
});

export const PRODUCT_META = {
  heloc: {
    name: "HELOC",
    shortName: "HELOC",
    description: "Flexible line of credit with variable rates and interest-only payments.",
  },
  heloan: {
    name: "HELOAN",
    shortName: "HELOAN",
    description: "Fixed-rate second mortgage with predictable monthly payments.",
  },
  refi: {
    name: "Cash-out refinance",
    shortName: "Refinance",
    description: "Replace your current mortgage with a larger loan and access cash.",
  },
  reverse: {
    name: "Reverse mortgage",
    shortName: "Reverse",
    description: "Borrow against equity without a monthly payment if eligible.",
  },
  hei: {
    name: "Home equity investment",
    shortName: "HEI",
    description: "Receive cash from an investor in exchange for a share of future appreciation.",
  },
  coownership: {
    name: "Co-ownership",
    shortName: "Co-ownership",
    description: "Share ownership and future appreciation with a partner investor.",
  },
  saleLeaseback: {
    name: "Sale leaseback",
    shortName: "Sale leaseback",
    description: "Sell the home, retain occupancy through rent, and use proceeds as cash.",
  },
};

const formatNumber = (value) => Math.round(Number(value || 0));

const payment = (loanAmount, monthlyRate, numberOfMonths) => {
  if (numberOfMonths <= 0 || monthlyRate === 0) {
    return 0;
  }

  return (
    (loanAmount * monthlyRate * ((1 + monthlyRate) ** numberOfMonths)) /
    (((1 + monthlyRate) ** numberOfMonths) - 1)
  );
};

export const formatCurrency = (value) => {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return formatter.format(value);
};

export const formatSignedCurrency = (value) => {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const absValue = Math.abs(value);
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return `${value < 0 ? "-" : "+"}${formatter.format(absValue)}`;
};

export const getProductComparisons = (inputs = DEFAULT_INPUTS) => {
  const homeValue = Number(inputs.homeValue) || DEFAULT_INPUTS.homeValue;
  const mortgageBalance = Number(inputs.mortgageBalance) || DEFAULT_INPUTS.mortgageBalance;
  const currentMortgageRate = Number(inputs.currentMortgageRate) || DEFAULT_INPUTS.currentMortgageRate;
  const yearsRemaining = Number(inputs.yearsRemaining) || DEFAULT_INPUTS.yearsRemaining;
  const cashNeeded = Number(inputs.cashNeeded) || DEFAULT_INPUTS.cashNeeded;
  const homeOwnerAge = Number(inputs.homeOwnerAge) || DEFAULT_INPUTS.homeOwnerAge;

  const currentEquity = homeValue - mortgageBalance;
  const annualGrowthFactor = 1.03;
  const newLoan = mortgageBalance + cashNeeded;
  const refiRateMonthly = 7.25 / 100 / 12;
  const refiPi = payment(newLoan, refiRateMonthly, 360);

  const oldRateMonthly = currentMortgageRate / 100 / 12;
  const oldMonths = yearsRemaining * 12;
  const oldPi = oldMonths > 0 ? payment(mortgageBalance, oldRateMonthly, oldMonths) : 0;

  const helocClosingCost = formatNumber(Math.min(cashNeeded * 0.02, 3000));
  const helocMonthlyRate = 8.5 / 100 / 12;
  const helocMonthly = cashNeeded * helocMonthlyRate;
  const helocMonthlyPayment = -Math.round(helocMonthly);
  const helocCashNet = cashNeeded - helocClosingCost;
  const helocCost10 = formatNumber(helocMonthly * 120 + helocClosingCost);
  const helocEquityAt = (years) =>
    formatNumber(currentEquity - cashNeeded * Math.max(0, 1 - years / 15) + homeValue * (annualGrowthFactor ** years - 1));

  const heloanClosingCost = formatNumber(Math.min(cashNeeded * 0.025, 3500));
  const heloanRateMonthly = 8.0 / 100 / 12;
  const heloanPi = payment(cashNeeded, heloanRateMonthly, 180);
  const heloanMonthlyPayment = -Math.round(heloanPi);
  const heloanCashNet = cashNeeded - heloanClosingCost;
  const heloanCost10 = formatNumber(heloanPi * 120 + heloanClosingCost);
  const heloanEquityAt = (years) =>
    formatNumber(currentEquity - cashNeeded * Math.max(0, 1 - years / 15) + homeValue * (annualGrowthFactor ** years - 1));

  const refiClosingCost = formatNumber(Math.min(newLoan * 0.025, 8000));
  const refiMonthlyImpact = -Math.round(refiPi - oldPi);
  const refiCashNet = cashNeeded - refiClosingCost;
  const refiCost10 = formatNumber((refiPi - oldPi) * 120 + refiClosingCost);
  const remainingBalance = (years) => {
    const remainingYears = years * 12;
    const numerator = (1 + refiRateMonthly) ** 360 - (1 + refiRateMonthly) ** remainingYears;
    const denominator = (1 + refiRateMonthly) ** 360 - 1;
    return newLoan * (numerator / denominator);
  };
  const refiEquityAt = (years) => formatNumber(homeValue * annualGrowthFactor ** years - remainingBalance(years));

  const eligible = homeOwnerAge >= 62;
  const plf = eligible ? Math.min(0.6, 0.3 + (homeOwnerAge - 62) * 0.015) : 0;
  const reverseAmount = eligible ? Math.min(cashNeeded, currentEquity * plf * 0.95) : 0;
  const reverseClosingCost = eligible ? formatNumber(reverseAmount * 0.04) : 0;
  const reverseMonthly = eligible ? Math.round(reverseAmount * 0.005) : 0;
  const reverseCashNet = eligible ? Math.min(reverseAmount, cashNeeded) - reverseClosingCost : 0;
  const reverseCost10 = eligible ? formatNumber(reverseAmount * (1.075 ** 10 - 1)) : null;
  const reverseEquityAt = (years) =>
    eligible
      ? Math.max(0, formatNumber(currentEquity - reverseAmount * 1.075 ** years + homeValue * (annualGrowthFactor ** years - 1)))
      : currentEquity;

  const heiShare = 0.15;
  const heiDiscount = 0.88;
  const heiMonthly = 0;
  const heiCashNet = formatNumber(cashNeeded * heiDiscount);
  const heiCashCost = formatNumber(cashNeeded * 0.03);
  const heiCost10 = formatNumber(homeValue * annualGrowthFactor ** 10 * heiShare - homeValue * heiShare);
  const heiEquityAt = (years) => formatNumber(homeValue * annualGrowthFactor ** years * (1 - heiShare) - mortgageBalance);

  const coShare = Math.min(cashNeeded / homeValue, 0.49);
  const coDiscount = 0.9;
  const coMonthly = 0;
  const coCashNet = formatNumber(cashNeeded * coDiscount);
  const coCashCost = formatNumber(cashNeeded * 0.02);
  const coCost10 = formatNumber(homeValue * annualGrowthFactor ** 10 * coShare - homeValue * coShare);
  const coEquityAt = (years) => formatNumber(homeValue * annualGrowthFactor ** years * (1 - coShare) - mortgageBalance);

  const salePrice = formatNumber(homeValue * 0.875);
  const saleNet = salePrice - mortgageBalance;
  const rent = formatNumber(homeValue * 0.005);
  const saleCashCost = formatNumber(homeValue * 0.02);
  const saleCashNet = saleNet - saleCashCost;
  const saleMonthly = -rent;
  const saleCost10 = formatNumber(rent * 120);

  const years = [0, 1, 2, 3, 5, 7, 10, 15, 20];

  const products = {
    heloc: {
      id: "heloc",
      name: PRODUCT_META.heloc.name,
      score: 0,
      monthly: helocMonthlyPayment,
      cashNet: helocCashNet,
      cashCost: helocClosingCost,
      cost10: helocCost10,
      equityAt5: helocEquityAt(5),
      equityAt10: helocEquityAt(10),
      equityAt15: helocEquityAt(15),
      ineligible: false,
      chart: years.map((year) => ({
        year,
        cash: formatNumber((helocCashNet + helocEquityAt(year)) / 1000),
        equity: Math.max(0, formatNumber(helocEquityAt(year) / 1000)),
        cumulativeCost: formatNumber((Math.abs(helocMonthlyPayment) * year * 12 + helocClosingCost) / 1000),
      })),
    },
    heloan: {
      id: "heloan",
      name: PRODUCT_META.heloan.name,
      score: 0,
      monthly: heloanMonthlyPayment,
      cashNet: heloanCashNet,
      cashCost: heloanClosingCost,
      cost10: heloanCost10,
      equityAt5: heloanEquityAt(5),
      equityAt10: heloanEquityAt(10),
      equityAt15: heloanEquityAt(15),
      ineligible: false,
      chart: years.map((year) => ({
        year,
        cash: formatNumber((heloanCashNet + heloanEquityAt(year)) / 1000),
        equity: Math.max(0, formatNumber(heloanEquityAt(year) / 1000)),
        cumulativeCost: formatNumber((Math.abs(heloanMonthlyPayment) * year * 12 + heloanClosingCost) / 1000),
      })),
    },
    refi: {
      id: "refi",
      name: PRODUCT_META.refi.name,
      score: 0,
      monthly: refiMonthlyImpact,
      cashNet: refiCashNet,
      cashCost: refiClosingCost,
      cost10: refiCost10,
      equityAt5: refiEquityAt(5),
      equityAt10: refiEquityAt(10),
      equityAt15: refiEquityAt(15),
      ineligible: false,
      chart: years.map((year) => ({
        year,
        cash: formatNumber((refiCashNet + refiEquityAt(year)) / 1000),
        equity: Math.max(0, formatNumber(refiEquityAt(year) / 1000)),
        cumulativeCost: formatNumber((Math.abs(refiMonthlyImpact) * year * 12 + refiClosingCost) / 1000),
      })),
    },
    reverse: {
      id: "reverse",
      name: PRODUCT_META.reverse.name,
      score: 0,
      monthly: reverseMonthly,
      cashNet: reverseCashNet,
      cashCost: reverseClosingCost,
      cost10: reverseCost10,
      equityAt5: reverseEquityAt(5),
      equityAt10: reverseEquityAt(10),
      equityAt15: reverseEquityAt(15),
      ineligible: !eligible,
      chart: eligible
        ? years.map((year) => ({
            year,
            cash: formatNumber((reverseCashNet + reverseEquityAt(year)) / 1000),
            equity: Math.max(0, formatNumber(reverseEquityAt(year) / 1000)),
            cumulativeCost: formatNumber((Math.abs(reverseMonthly) * year * 12 + reverseClosingCost) / 1000),
          }))
        : null,
    },
    hei: {
      id: "hei",
      name: PRODUCT_META.hei.name,
      score: 0,
      monthly: heiMonthly,
      cashNet: heiCashNet,
      cashCost: heiCashCost,
      cost10: heiCost10,
      equityAt5: heiEquityAt(5),
      equityAt10: heiEquityAt(10),
      equityAt15: heiEquityAt(15),
      ineligible: false,
      chart: years.map((year) => ({
        year,
        cash: formatNumber((heiCashNet + heiEquityAt(year)) / 1000),
        equity: Math.max(0, formatNumber(heiEquityAt(year) / 1000)),
        cumulativeCost: formatNumber((Math.abs(heiMonthly) * year * 12 + heiCashCost) / 1000),
      })),
    },
    coownership: {
      id: "coownership",
      name: PRODUCT_META.coownership.name,
      score: 0,
      monthly: coMonthly,
      cashNet: coCashNet,
      cashCost: coCashCost,
      cost10: coCost10,
      equityAt5: coEquityAt(5),
      equityAt10: coEquityAt(10),
      equityAt15: coEquityAt(15),
      ineligible: false,
      chart: years.map((year) => ({
        year,
        cash: formatNumber((coCashNet + coEquityAt(year)) / 1000),
        equity: Math.max(0, formatNumber(coEquityAt(year) / 1000)),
        cumulativeCost: formatNumber((Math.abs(coMonthly) * year * 12 + coCashCost) / 1000),
      })),
    },
    saleLeaseback: {
      id: "saleLeaseback",
      name: PRODUCT_META.saleLeaseback.name,
      score: 0,
      monthly: saleMonthly,
      cashNet: saleCashNet,
      cashCost: saleCashCost,
      cost10: saleCost10,
      equityAt5: 0,
      equityAt10: 0,
      equityAt15: 0,
      ineligible: false,
      chart: years.map((year) => ({
        year,
        cash: formatNumber((saleCashNet + 0) / 1000),
        equity: 0,
        cumulativeCost: formatNumber((Math.abs(saleMonthly) * year * 12 + saleCashCost) / 1000),
      })),
    },
  };

  return products;
};

export const getTopRecommendations = (answers, inputs = DEFAULT_INPUTS) => {
  const products = getProductComparisons(inputs);
  const scores = Object.fromEntries(Object.entries(products).map(([id]) => [id, 0]));

  const { goal, stay, payment, priority } = answers;

  if (stay === "soon") {
    scores.saleLeaseback += 3;
    scores.coownership += 2;
  }

  if (stay === "yes" || stay === "prob") {
    scores.saleLeaseback -= 3;
    scores.coownership -= 1;
  }

  if (payment === "no") {
    scores.reverse += 3;
    scores.hei += 3;
    scores.coownership += 2;
    scores.saleLeaseback += 1;
    scores.heloc -= 2;
    scores.heloan -= 2;
    scores.refi -= 2;
  }

  if (payment === "min") {
    scores.hei += 1;
    scores.reverse += 1;
    scores.heloc += 1;
  }

  if (payment === "yes") {
    scores.heloc += 2;
    scores.heloan += 2;
    scores.refi += 2;
  }

  if (goal === "lump") {
    scores.heloan += 2;
    scores.heloc += 1;
    scores.refi += 1;
    scores.hei += 1;
    scores.saleLeaseback += 1;
  }

  if (goal === "income") {
    scores.reverse += 3;
    scores.heloc += 1;
  }

  if (goal === "lower") {
    scores.refi += 3;
    scores.heloc -= 1;
  }

  if (goal === "faster") {
    scores.refi += 2;
  }

  if (priority === "cost") {
    scores.heloc += 2;
    scores.heloan += 2;
    scores.reverse -= 1;
    scores.hei -= 1;
  }

  if (priority === "cash") {
    scores.saleLeaseback += 2;
    scores.reverse += 1;
    scores.refi += 1;
  }

  if (priority === "equity") {
    scores.heloc += 1;
    scores.heloan += 1;
    scores.refi += 1;
    scores.hei -= 2;
    scores.coownership -= 2;
    scores.saleLeaseback -= 3;
  }

  if (priority === "simple") {
    scores.refi += 1;
    scores.heloan += 1;
  }

  const allProducts = Object.keys(products)
    .map((productId) => ({
      ...products[productId],
      score: scores[productId] ?? 0,
      ineligible: productId === "reverse" ? Number(inputs.homeOwnerAge) < 62 : false,
    }))
    .map((product) => ({
      ...product,
      score: product.id === "reverse" && product.ineligible ? -99 : product.score,
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const recommendedProducts = allProducts.filter((product) => product.score > -99).slice(0, 3);

  return {
    recommendations: recommendedProducts,
    allProducts,
    answers,
  };
};
