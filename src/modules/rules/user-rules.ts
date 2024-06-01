export const USER_ACCOUNT_PATTERN = /^[\w.+*/\\-]{4,18}$/;
export const USER_ACCOUNT_HINT = "账号长度4-18，只可包含字母/数字常见符号";

// eslint-disable-next-line no-useless-escape
export const USER_PASSWORD_PATTERN = /^[\w.+*/\\-]{6,18}$/;
export const USER_PASSWORD_HINT = "密码长度6-18，只可包含字母/数字/常见符号";
