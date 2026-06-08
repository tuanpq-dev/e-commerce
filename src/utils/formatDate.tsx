const formatDate = (time: string | number) => {
  const date = new Date(time);
  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

export default formatDate;
