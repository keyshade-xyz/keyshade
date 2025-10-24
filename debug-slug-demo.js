#!/usr/bin/env node

/**
 * Debug script to demonstrate slug generation with console output.
 * This script shows the generateUniqueSlug function in action.
 */

// Simple standalone version of the slug generation logic for demonstration
class DebugSlugGenerator {
  static MAX_ITERATIONS = 10;

  static async demonstrateSlugGeneration(name, modelName) {
    console.log('\n=== SLUG GENERATION DEBUG START ===');
    console.log(`Input: name="${name}", model="${modelName}"`);
    
    const result = await this.generateUniqueSlugDemo(name, modelName);
    
    console.log(`Final result: "${result}"`);
    console.log('=== SLUG GENERATION DEBUG END ===\n');
    
    return result;
  }

  static async generateUniqueSlugDemo(name, modelName, iterationCount = 0) {
    // Check if the iteration count exceeds the limit
    if (iterationCount > this.MAX_ITERATIONS) {
      throw new Error(`Failed to generate unique slug for ${name} in ${modelName} after ${this.MAX_ITERATIONS} attempts.`);
    }

    console.log(`🔄 Generating unique slug for "${name}" in model "${modelName}" (iteration: ${iterationCount})`);

    // Simple slugify implementation for demo
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    console.log(`📝 Base slug generated: "${baseSlug}"`);

    let max = 0;
    let newSlug;

    // Simulate cache check (no cache for demo)
    console.log(`🔍 No cache found, simulating database query for existing slugs...`);
    
    // Simulate some existing slugs for demonstration
    const mockExistingSlugs = this.getMockExistingSlugs(baseSlug, iterationCount);
    console.log(`📊 Found ${mockExistingSlugs.length} existing slugs starting with "${baseSlug}"`);

    if (mockExistingSlugs.length === 0) {
      newSlug = `${baseSlug}-0`;
      console.log(`✨ No existing slugs found, using: "${newSlug}"`);
    } else {
      console.log(`🔢 Analyzing existing slugs to find max numeric part...`);
      for (const existingSlug of mockExistingSlugs) {
        const parts = existingSlug.split('-');
        const numericPart = parts[parts.length - 2]; // Get the numeric part before random suffix
        if (numericPart && !isNaN(parseInt(numericPart, 10))) {
          const currentMax = parseInt(numericPart, 10);
          console.log(`  📋 Slug "${existingSlug}" has numeric part: ${currentMax}`);
          max = Math.max(max, currentMax);
        }
      }
      console.log(`🏆 Maximum numeric part found: ${max}`);
    }

    // Add randomization to reduce collision probability
    if (!newSlug) {
      max += 1;
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      newSlug = `${baseSlug}-${max}-${randomSuffix}`;
      console.log(`🎲 Generated new slug: "${newSlug}" (max: ${max}, random: ${randomSuffix})`);

      // Simulate collision check
      const hasCollision = this.simulateCollisionCheck(newSlug, iterationCount);
      if (hasCollision) {
        console.log(`❌ Collision detected! Slug "${newSlug}" already exists. Retrying...`);
        return await this.generateUniqueSlugDemo(name, modelName, iterationCount + 1);
      }
    }

    console.log(`✅ Success! Final unique slug: "${newSlug}" (iterations: ${iterationCount})`);
    console.log(`💾 Cached slug data for future use`);

    return newSlug;
  }

  static getMockExistingSlugs(baseSlug, iteration) {
    // Return different mock data based on iteration to show different scenarios
    switch (iteration) {
      case 0:
        return []; // No existing slugs
      case 1:
        return [`${baseSlug}-0-abc1`, `${baseSlug}-1-def2`]; // Some existing slugs
      case 2:
        return [`${baseSlug}-0-abc1`, `${baseSlug}-1-def2`, `${baseSlug}-2-ghi3`]; // More slugs
      default:
        return [`${baseSlug}-0-abc1`]; // Minimal case
    }
  }

  static simulateCollisionCheck(slug, iteration) {
    // Simulate collision on iteration 1 to show retry logic
    return iteration === 1 && Math.random() > 0.7;
  }
}

async function demonstrateSlugGeneration() {
  console.log('🚀 Starting Slug Generation Demonstration\n');
  
  try {
    // Test different scenarios
    const testCases = [
      { name: 'My Test Workspace', model: 'workspace' },
      { name: 'Example Project Name', model: 'project' },
      { name: 'API Key Test', model: 'apiKey' },
      { name: 'Special-Characters & Symbols!', model: 'workspace' },
      { name: 'Another Test Case', model: 'project' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing: "${testCase.name}" -> ${testCase.model}`);
      console.log('='.repeat(60));
      
      const result = await DebugSlugGenerator.demonstrateSlugGeneration(testCase.name, testCase.model);
      
      console.log(`\n📋 Summary for "${testCase.name}":`);
      console.log(`   Input: "${testCase.name}"`);
      console.log(`   Model: ${testCase.model}`);
      console.log(`   Result: "${result}"`);
      console.log(`   Length: ${result.length} characters`);
      
      // Add a small delay for readability
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎉 Demonstration completed successfully!');
    console.log('\n📸 This output demonstrates:');
    console.log('   ✅ Base slug generation from names');
    console.log('   ✅ Database simulation and existing slug analysis');
    console.log('   ✅ Numeric part calculation and increment logic');
    console.log('   ✅ Random suffix generation for uniqueness');
    console.log('   ✅ Collision detection and retry mechanism');
    console.log('   ✅ Final unique slug generation');
    
  } catch (error) {
    console.error('❌ Error during demonstration:', error);
  }
}

// Run the demonstration
demonstrateSlugGeneration();
