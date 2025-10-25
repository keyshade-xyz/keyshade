#!/usr/bin/env node

/**
 * Enhanced debug script showing complex slug generation scenarios.
 * This demonstrates collision handling, retries, and existing slug analysis.
 */

class EnhancedSlugGenerator {
  static MAX_ITERATIONS = 10;

  static async demonstrateComplexScenarios() {
    console.log('🚀 Starting Enhanced Slug Generation Demo with Complex Scenarios\n');
    
    // Scenario 1: No existing slugs (simple case)
    await this.runScenario(
      'Simple Case - No Existing Slugs',
      'Test Workspace',
      'workspace',
      []
    );
    
    // Scenario 2: Multiple existing slugs
    await this.runScenario(
      'Complex Case - Multiple Existing Slugs',
      'Test Workspace',
      'workspace',
      ['test-workspace-0-abc1', 'test-workspace-1-def2', 'test-workspace-3-ghi3']
    );
    
    // Scenario 3: Collision and retry
    await this.runScenarioWithCollision(
      'Collision Case - Retry Required',
      'Test Workspace',
      'workspace',
      ['test-workspace-0-abc1', 'test-workspace-1-def2']
    );
    
    // Scenario 4: Special characters handling
    await this.runScenario(
      'Special Characters Case',
      'My Special Project! @#$%',
      'project',
      ['my-special-project-0-xyz1']
    );
  }

  static async runScenario(title, name, model, existingSlugs) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 SCENARIO: ${title}`);
    console.log('='.repeat(70));
    
    const result = await this.generateSlugWithMockData(name, model, existingSlugs, false);
    
    console.log(`\n🎯 RESULT: "${result}"`);
    console.log(`📏 Length: ${result.length} characters`);
  }

  static async runScenarioWithCollision(title, name, model, existingSlugs) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 SCENARIO: ${title}`);
    console.log('='.repeat(70));
    
    const result = await this.generateSlugWithMockData(name, model, existingSlugs, true);
    
    console.log(`\n🎯 RESULT: "${result}"`);
    console.log(`📏 Length: ${result.length} characters`);
  }

  static async generateSlugWithMockData(name, model, existingSlugs, simulateCollision, iterationCount = 0) {
    if (iterationCount > this.MAX_ITERATIONS) {
      throw new Error(`Failed to generate unique slug after ${this.MAX_ITERATIONS} attempts.`);
    }

    console.log(`\n🔄 ITERATION ${iterationCount}: Generating slug for "${name}"`);
    console.log(`📊 Model: ${model}`);

    // Step 1: Generate base slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    console.log(`📝 Base slug: "${baseSlug}"`);

    // Step 2: Check cache (simulated as empty)
    console.log(`💾 Cache check: No cached data found`);

    // Step 3: Analyze existing slugs
    console.log(`\n🔍 Analyzing existing slugs in database:`);
    if (existingSlugs.length === 0) {
      console.log(`   📭 No existing slugs found`);
    } else {
      console.log(`   📚 Found ${existingSlugs.length} existing slugs:`);
      existingSlugs.forEach(slug => console.log(`      • ${slug}`));
    }

    let max = 0;
    let newSlug;

    if (existingSlugs.length === 0) {
      newSlug = `${baseSlug}-0`;
      console.log(`\n✨ First slug for this base, using: "${newSlug}"`);
    } else {
      console.log(`\n🔢 Analyzing numeric parts:`);
      for (const existingSlug of existingSlugs) {
        const parts = existingSlug.split('-');
        // Find the numeric part (usually second to last part before random suffix)
        for (let i = parts.length - 2; i >= 0; i--) {
          const part = parts[i];
          if (!isNaN(parseInt(part, 10))) {
            const currentMax = parseInt(part, 10);
            console.log(`   📊 "${existingSlug}" → numeric part: ${currentMax}`);
            max = Math.max(max, currentMax);
            break;
          }
        }
      }
      console.log(`   🏆 Maximum numeric part found: ${max}`);
    }

    // Step 4: Generate new slug with randomization
    if (!newSlug) {
      max += 1;
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      newSlug = `${baseSlug}-${max}-${randomSuffix}`;
      console.log(`\n🎲 Generated candidate: "${newSlug}"`);
      console.log(`   🔢 Next numeric value: ${max}`);
      console.log(`   🎯 Random suffix: ${randomSuffix}`);
    }

    // Step 5: Check for collision
    console.log(`\n🔎 Collision check:`);
    const hasCollision = simulateCollision && iterationCount === 0;
    if (hasCollision) {
      console.log(`   ❌ COLLISION! Slug "${newSlug}" already exists`);
      console.log(`   🔄 Retrying with iteration ${iterationCount + 1}...`);
      return await this.generateSlugWithMockData(name, model, existingSlugs, false, iterationCount + 1);
    } else {
      console.log(`   ✅ No collision detected - slug is unique!`);
    }

    // Step 6: Cache and return
    console.log(`\n💾 Caching slug data for future lookups`);
    console.log(`✅ SUCCESS: Generated unique slug in ${iterationCount + 1} iteration(s)`);

    return newSlug;
  }
}

// Run the enhanced demonstration
EnhancedSlugGenerator.demonstrateComplexScenarios().then(() => {
  console.log('\n🎊 Enhanced demonstration completed!');
  console.log('\n📸 Screenshots should capture:');
  console.log('   🔸 Different input scenarios (simple names, special characters)');
  console.log('   🔸 Database analysis with existing slugs');
  console.log('   🔸 Numeric part calculation and max finding');
  console.log('   🔸 Random suffix generation');
  console.log('   🔸 Collision detection and retry logic');
  console.log('   🔸 Final success with unique slug generation');
}).catch(console.error);
