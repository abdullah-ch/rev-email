import validator from "email-validator"


export const isEmailValid = (email) => {
  return validator.validate(email.toLowerCase());
};