// Create this file: backend/scripts/cleanDuplicateMembers.js
// Run once to clean existing duplicate members

const mongoose = require('mongoose');
const Workspace = require('../models/workspaceModel');
require('dotenv').config();

const cleanDuplicateMembers = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const workspaces = await Workspace.find({});
    console.log(`📊 Found ${workspaces.length} workspaces to check\n`);
    
    let totalDuplicatesRemoved = 0;
    let workspacesFixed = 0;
    
    for (const workspace of workspaces) {
      const uniqueMembers = [];
      const seenUserIds = new Set();
      let duplicatesInWorkspace = 0;
      
      console.log(`\n🔍 Checking workspace: "${workspace.name}" (ID: ${workspace._id})`);
      console.log(`   Current member count: ${workspace.members.length}`);
      
      // Keep only first occurrence of each user
      for (const member of workspace.members) {
        const userId = member.user.toString();
        
        if (!seenUserIds.has(userId)) {
          seenUserIds.add(userId);
          uniqueMembers.push(member);
        } else {
          duplicatesInWorkspace++;
          totalDuplicatesRemoved++;
          console.log(`   🗑️  Found duplicate: User ${userId}`);
        }
      }
      
      if (duplicatesInWorkspace > 0) {
        workspace.members = uniqueMembers;
        await workspace.save();
        workspacesFixed++;
        console.log(`   ✅ Cleaned! Removed ${duplicatesInWorkspace} duplicates`);
        console.log(`   📝 New member count: ${uniqueMembers.length}`);
      } else {
        console.log(`   ✨ No duplicates found - workspace is clean`);
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 CLEANUP SUMMARY:');
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Total workspaces checked: ${workspaces.length}`);
    console.log(`🔧 Workspaces fixed: ${workspacesFixed}`);
    console.log(`🗑️  Total duplicates removed: ${totalDuplicatesRemoved}`);
    console.log(`${'='.repeat(60)}\n`);
    
    if (totalDuplicatesRemoved === 0) {
      console.log('🎉 No duplicates found - your database is clean!');
    } else {
      console.log('🎉 Cleanup completed successfully!');
    }
    
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ CLEANUP ERROR:', error);
    console.error('Stack trace:', error.stack);
    
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error('Error closing connection:', closeError);
    }
    
    process.exit(1);
  }
};

// Run the cleanup
console.log('🚀 Starting duplicate member cleanup...\n');
cleanDuplicateMembers();