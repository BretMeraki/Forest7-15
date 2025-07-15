#!/usr/bin/env node

/**
 * Simple test to check actual generated output
 */

import { Stage1CoreServer } from './core-server.js';

// Set shorter timeout for LLM requests to prevent hanging
const originalTimeout = process.env.LLM_TIMEOUT;
process.env.LLM_TIMEOUT = '30000'; // 30 seconds

async function simpleTest() {
    const server = new Stage1CoreServer({
        dataPersistence: { dataDir: './.simple-test-data' },
        vectorProvider: {
            provider: 'SQLiteVecProvider',
            config: { 
                dbPath: './.simple-test-data/vectors.db',
                enableCache: true
            }
        }
    });

    try {
        console.log('Initializing...');
        await server.initialize();

        console.log('Creating pottery project...');
        const projectResult = await server.createProject({
            goal: "Learn basic pottery wheel throwing",
            context: "Never touched clay before"
        });

        if (!projectResult.success) {
            throw new Error(`Project creation failed: ${projectResult.error}`);
        }

        console.log('Setting up onboarding state for testing...');
        // Bypass gated onboarding for testing by creating completed onboarding state
        await server.dataPersistence.saveProjectData(projectResult.project_id, 'onboarding_state.json', {
            current_stage: 'completed',
            goal: "Learn basic pottery wheel throwing",
            context: "Never touched clay before",
            user_profile: { experience_level: "beginner" },
            aggregate_context: {
                goal: "Learn basic pottery wheel throwing",
                context: "Never touched clay before",
                complexity: { score: 6, level: "moderate", recommended_depth: 3 },
                user_profile: { experience_level: "beginner" }
            }
        });

        console.log('Building HTA tree for pottery goal...');
        const buildResult = await server.buildHTATree({
            goal: "Learn basic pottery wheel throwing",
            context: "Never touched clay before"
        });

        if (!buildResult.success) {
            throw new Error(`HTA tree building failed: ${buildResult.error}`);
        }

        console.log('Getting HTA status to see what was generated...');
        const status = await server.getHTAStatus();
        
        if (status && status.content && status.content[0]) {
            const content = status.content[0].text;
            console.log('\n=== GENERATED CONTENT ===');
            console.log(content.substring(0, 1000));
            console.log('\n=== END SAMPLE ===');
            
            // Check for pottery terms
            const lowerContent = content.toLowerCase();
            const potteryTerms = ['pottery', 'clay', 'wheel', 'throwing', 'ceramic', 'kiln'];
            const foundTerms = potteryTerms.filter(term => lowerContent.includes(term));
            
            console.log(`\nPottery terms found: ${foundTerms.join(', ')}`);
            
            if (foundTerms.length >= 3) {
                console.log('✅ SUCCESS: System is generating domain-specific content!');
                return true;
            } else {
                console.log('❌ FAILURE: Content not domain-specific enough');
                return false;
            }
        } else {
            console.log('❌ No content generated');
            return false;
        }

    } catch (error) {
        console.error('Test error:', error.message);
        return false;
    } finally {
        // Restore original timeout
        if (originalTimeout) {
            process.env.LLM_TIMEOUT = originalTimeout;
        } else {
            delete process.env.LLM_TIMEOUT;
        }
        
        try {
            await server.cleanup();
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

simpleTest().then(success => {
    console.log(success ? '\n🎉 DOMAIN-AGNOSTIC SYSTEM WORKING!' : '\n💥 System has issues');
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test crashed:', error.message);
    process.exit(1);
});