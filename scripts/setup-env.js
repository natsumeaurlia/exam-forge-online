#!/usr/bin/env node

/**
 * Environment Setup Script for ExamForge
 * This script helps developers set up their environment variables
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateSecret() {
  return crypto.randomBytes(32).toString('base64');
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function setupEnvironment() {
  console.log('\n🔧 ExamForge Environment Setup');
  console.log('================================\n');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('❓ .env file already exists. Do you want to overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('✅ Setup cancelled. Existing .env file preserved.');
      rl.close();
      return;
    }
  }

  const envVars = {};

  console.log('📋 Let\'s set up your environment variables step by step.\n');

  // Required variables
  console.log('🔐 Required Variables');
  console.log('--------------------');

  // Database URL
  const dbUrl = await question('📊 Database URL (press Enter for default local PostgreSQL): ');
  envVars.DATABASE_URL = dbUrl.trim() || 'postgresql://username:password@localhost:5432/examforge_db';

  // NextAuth Secret
  console.log('🔑 NextAuth Secret (used for JWT signing)');
  const useGeneratedSecret = await question('  Generate a secure secret automatically? (Y/n): ');
  if (useGeneratedSecret.toLowerCase() === 'n' || useGeneratedSecret.toLowerCase() === 'no') {
    let customSecret;
    do {
      customSecret = await question('  Enter your custom secret (minimum 32 characters): ');
      if (customSecret.length < 32) {
        console.log('  ❌ Secret must be at least 32 characters long');
      }
    } while (customSecret.length < 32);
    envVars.NEXTAUTH_SECRET = customSecret;
  } else {
    envVars.NEXTAUTH_SECRET = generateSecret();
    console.log('  ✅ Generated secure secret');
  }

  // NextAuth URL
  const nextAuthUrl = await question('🌐 Application URL (press Enter for localhost:3000): ');
  envVars.NEXTAUTH_URL = nextAuthUrl.trim() || 'http://localhost:3000';

  // Optional OAuth providers
  console.log('\n🔗 OAuth Providers (Optional)');
  console.log('------------------------------');

  const setupGoogle = await question('🟦 Set up Google OAuth? (y/N): ');
  if (setupGoogle.toLowerCase() === 'y' || setupGoogle.toLowerCase() === 'yes') {
    console.log('   Get these from: https://console.cloud.google.com/');
    envVars.GOOGLE_CLIENT_ID = await question('   Google Client ID: ');
    envVars.GOOGLE_CLIENT_SECRET = await question('   Google Client Secret: ');
  }

  const setupGithub = await question('🐙 Set up GitHub OAuth? (y/N): ');
  if (setupGithub.toLowerCase() === 'y' || setupGithub.toLowerCase() === 'yes') {
    console.log('   Get these from: https://github.com/settings/developers');
    envVars.GITHUB_ID = await question('   GitHub Client ID: ');
    envVars.GITHUB_SECRET = await question('   GitHub Client Secret: ');
  }

  // Optional Stripe
  console.log('\n💳 Stripe Payment (Optional)');
  console.log('-----------------------------');

  const setupStripe = await question('💰 Set up Stripe payments? (y/N): ');
  if (setupStripe.toLowerCase() === 'y' || setupStripe.toLowerCase() === 'yes') {
    console.log('   Get these from: https://dashboard.stripe.com/');
    envVars.STRIPE_SECRET_KEY = await question('   Stripe Secret Key: ');
    envVars.STRIPE_PUBLISHABLE_KEY = await question('   Stripe Publishable Key: ');
    envVars.STRIPE_WEBHOOK_SECRET = await question('   Stripe Webhook Secret: ');
  }

  // Optional Storage
  console.log('\n📁 File Storage (Optional)');
  console.log('--------------------------');

  const setupStorage = await question('☁️  Set up S3-compatible storage? (y/N): ');
  if (setupStorage.toLowerCase() === 'y' || setupStorage.toLowerCase() === 'yes') {
    envVars.S3_ENDPOINT = await question('   S3 Endpoint URL: ');
    envVars.S3_ACCESS_KEY_ID = await question('   Access Key ID: ');
    envVars.S3_SECRET_ACCESS_KEY = await question('   Secret Access Key: ');
    envVars.S3_BUCKET_NAME = await question('   Bucket Name: ');
    const s3Region = await question('   Region (press Enter for us-east-1): ');
    envVars.S3_REGION = s3Region.trim() || 'us-east-1';
  }

  // Optional Email
  console.log('\n📧 Email Service (Optional)');
  console.log('---------------------------');

  const setupEmail = await question('📮 Set up email service (Resend)? (y/N): ');
  if (setupEmail.toLowerCase() === 'y' || setupEmail.toLowerCase() === 'yes') {
    console.log('   Get API key from: https://resend.com/');
    envVars.RESEND_API_KEY = await question('   Resend API Key: ');
  }

  // Generate .env file
  console.log('\n📝 Generating .env file...');

  let envContent = '# ExamForge Environment Variables\n';
  envContent += '# Generated by setup script\n\n';

  envContent += '# Core Configuration\n';
  envContent += `DATABASE_URL="${envVars.DATABASE_URL}"\n`;
  envContent += `NEXTAUTH_SECRET="${envVars.NEXTAUTH_SECRET}"\n`;
  envContent += `NEXTAUTH_URL="${envVars.NEXTAUTH_URL}"\n`;

  if (envVars.GOOGLE_CLIENT_ID || envVars.GITHUB_ID) {
    envContent += '\n# OAuth Providers\n';
    if (envVars.GOOGLE_CLIENT_ID) {
      envContent += `GOOGLE_CLIENT_ID="${envVars.GOOGLE_CLIENT_ID}"\n`;
      envContent += `GOOGLE_CLIENT_SECRET="${envVars.GOOGLE_CLIENT_SECRET}"\n`;
    }
    if (envVars.GITHUB_ID) {
      envContent += `GITHUB_ID="${envVars.GITHUB_ID}"\n`;
      envContent += `GITHUB_SECRET="${envVars.GITHUB_SECRET}"\n`;
    }
  }

  if (envVars.STRIPE_SECRET_KEY) {
    envContent += '\n# Stripe Payment\n';
    envContent += `STRIPE_SECRET_KEY="${envVars.STRIPE_SECRET_KEY}"\n`;
    envContent += `STRIPE_PUBLISHABLE_KEY="${envVars.STRIPE_PUBLISHABLE_KEY}"\n`;
    envContent += `STRIPE_WEBHOOK_SECRET="${envVars.STRIPE_WEBHOOK_SECRET}"\n`;
  }

  if (envVars.S3_ENDPOINT) {
    envContent += '\n# File Storage\n';
    envContent += `S3_ENDPOINT="${envVars.S3_ENDPOINT}"\n`;
    envContent += `S3_ACCESS_KEY_ID="${envVars.S3_ACCESS_KEY_ID}"\n`;
    envContent += `S3_SECRET_ACCESS_KEY="${envVars.S3_SECRET_ACCESS_KEY}"\n`;
    envContent += `S3_BUCKET_NAME="${envVars.S3_BUCKET_NAME}"\n`;
    envContent += `S3_REGION="${envVars.S3_REGION}"\n`;
  }

  if (envVars.RESEND_API_KEY) {
    envContent += '\n# Email Service\n';
    envContent += `RESEND_API_KEY="${envVars.RESEND_API_KEY}"\n`;
  }

  envContent += '\n# Development Settings\n';
  envContent += 'NODE_ENV="development"\n';

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    rl.close();
    return;
  }

  // Summary
  console.log('\n📋 Setup Summary');
  console.log('================');
  console.log(`📊 Database: ${envVars.DATABASE_URL}`);
  console.log(`🌐 App URL: ${envVars.NEXTAUTH_URL}`);
  
  const oauthProviders = [];
  if (envVars.GOOGLE_CLIENT_ID) oauthProviders.push('Google');
  if (envVars.GITHUB_ID) oauthProviders.push('GitHub');
  console.log(`🔗 OAuth: ${oauthProviders.length > 0 ? oauthProviders.join(', ') : 'None configured'}`);
  
  console.log(`💳 Stripe: ${envVars.STRIPE_SECRET_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`📁 Storage: ${envVars.S3_ENDPOINT ? 'Configured' : 'Not configured'}`);
  console.log(`📧 Email: ${envVars.RESEND_API_KEY ? 'Configured' : 'Not configured'}`);

  console.log('\n🚀 Next Steps');
  console.log('=============');
  console.log('1. Review the generated .env file');
  console.log('2. Install dependencies: cd web && pnpm install');
  console.log('3. Set up the database: pnpm db:migrate');
  console.log('4. Start the development server: pnpm dev');
  console.log('\n📚 For detailed setup instructions, see:');
  console.log('   docs/oauth-setup-guide.md');

  rl.close();
}

// Handle process termination
rl.on('SIGINT', () => {
  console.log('\n\n❌ Setup cancelled by user');
  rl.close();
  process.exit(0);
});

// Run the setup
setupEnvironment().catch(error => {
  console.error('\n❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});