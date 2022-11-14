require('dotenv').config();

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  env: {
  	ALCHEMY_KEY: process.env.ALCHEMY_KEY,
  	ALCHEMY_URL: process.env.ALCHEMY_BASE_URL
  } 
}
