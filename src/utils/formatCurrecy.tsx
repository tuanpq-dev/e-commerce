const formatCurrency = (value?: number | string) => {
  return `$ ${Number(value).toLocaleString("en")} `;
};

export default formatCurrency;
