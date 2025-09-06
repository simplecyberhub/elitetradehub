
import { DbStorage } from './db-storage';
import dotenv from 'dotenv';

dotenv.config();

async function migrateInvestmentsToTransactions() {
  const storage = new DbStorage();
  
  try {
    // Get all investments
    const investments = await storage.getInvestments();
    console.log(`Found ${investments.length} investments to migrate`);
    
    for (const investment of investments) {
      // Check if transaction already exists for this investment
      const existingTransactions = await storage.getTransactionsByUserId(investment.userId);
      const hasInvestmentTransaction = existingTransactions.some(
        t => t.type === 'investment' && 
        parseFloat(t.amount.toString()) === parseFloat(investment.amount.toString()) &&
        Math.abs(new Date(t.createdAt).getTime() - new Date(investment.startDate).getTime()) < 60000 // Within 1 minute
      );
      
      if (!hasInvestmentTransaction) {
        // Get investment plan details
        const plan = await storage.getInvestmentPlan(investment.planId);
        
        // Create transaction record
        const transactionData = {
          userId: investment.userId,
          type: "investment" as const,
          amount: investment.amount,
          status: "completed" as const,
          method: "balance",
          description: `Investment in ${plan?.name || 'Investment Plan'}`,
          completedAt: investment.startDate
        };
        
        await storage.createTransaction(transactionData);
        console.log(`Created transaction for investment ${investment.id}`);
      } else {
        console.log(`Transaction already exists for investment ${investment.id}`);
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await storage.close();
  }
}

if (require.main === module) {
  migrateInvestmentsToTransactions();
}
