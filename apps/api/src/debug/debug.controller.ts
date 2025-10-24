/**
 * Quick test endpoint to demonstrate slug generation.
 * Add this to any controller to test slug generation with debug output.
 * 
 * Example usage in a controller:
 * 
 * @Get('debug/slug/:name')
 * async debugSlug(@Param('name') name: string) {
 *   const slugGenerator = new SlugGenerator(this.prisma, this.redisClient);
 *   return await slugGenerator.debugSlugGeneration(name, 'workspace');
 * }
 */

import { Controller, Get, Param } from '@nestjs/common'
import SlugGenerator from '../common/slug-generator.service'

@Controller('debug')
export class DebugController {
  constructor(private readonly slugGenerator: SlugGenerator) {}

  @Get('slug/:name')
  async debugSlugGeneration(@Param('name') name: string) {
    console.log('\n🚀 DEBUG: Testing slug generation for:', name)
    
    try {
      // Test with workspace model
      const result = await this.slugGenerator.debugSlugGeneration(name, 'workspace')
      
      return {
        success: true,
        input: name,
        result: result,
        message: 'Check console for detailed debug output'
      }
    } catch (error) {
      console.error('❌ Error in slug generation:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  @Get('slug-demo')
  async slugDemo() {
    console.log('\n🎭 Running Slug Generation Demo...')
    
    const testNames = [
      'Test Workspace',
      'My Project Name',
      'Special Characters & Symbols!',
      'Already-Exists-Test'
    ]
    
    const results = []
    
    for (const name of testNames) {
      try {
        const result = await this.slugGenerator.debugSlugGeneration(name, 'workspace')
        results.push({ name, result, success: true })
      } catch (error) {
        results.push({ name, error: error.message, success: false })
      }
    }
    
    return {
      message: 'Demo completed - check console for detailed output',
      results
    }
  }
}
