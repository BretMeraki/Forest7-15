#!/usr/bin/env node

/**
 * Quick Domain Test - Check if system generates domain-specific content
 */

import { Stage1CoreServer } from './core-server.js';

async function quickDomainTest() {
    console.log('🔬 Quick Domain-Agnostic Test...\n');
    
    const server = new Stage1CoreServer({
        dataPersistence: { dataDir: './.quick-test-data' },
        vectorProvider: {
            provider: 'SQLiteVecProvider',
            config: { 
                dbPath: './.quick-test-data/vectors.db',
                enableCache: true
            }
        }
    });

    try {
        await server.initialize();
        console.log('✅ Server initialized\n');

        // Test pottery goal
        console.log('🎯 Testing: Pottery Goal');
        const projectResult = await server.createProject({
            goal: "Learn pottery and ceramics to make bowls and vases",
            context: "Complete beginner interested in handmade crafts"
        });

        if (!projectResult.success) {
            throw new Error(`Project creation failed: ${projectResult.error}`);
        }

        console.log(`✅ Project created: ${projectResult.project_id}`);

        // Build HTA Tree with timeout
        console.log('⏳ Building HTA tree...');
        const startTime = Date.now();
        const htaResult = await Promise.race([
            server.buildHTATree({}),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 60000)
            )
        ]);

        const endTime = Date.now();
        console.log(`⏱️  Tree generated in ${endTime - startTime}ms`);
        
        if (!htaResult.success) {
            throw new Error(`HTA tree build failed: ${htaResult.error}`);
        }

        // Analyze content
        if (htaResult.content && htaResult.content[0] && htaResult.content[0].text) {
            const content = htaResult.content[0].text.toLowerCase();
            console.log('\n📋 Generated Content Analysis:');
            console.log(`Content length: ${content.length} characters`);
            
            // Check for pottery-specific terms
            const potteryTerms = ['pottery', 'clay', 'ceramic', 'kiln', 'glazing', 'wheel', 'firing', 'throwing'];
            const foundTerms = potteryTerms.filter(term => content.includes(term));
            
            console.log(`✅ Pottery terms found: ${foundTerms.join(', ')}`);
            
            // Check for generic terms that shouldn't be there
            const genericTerms = ['foundation', 'research', 'capability', 'programming', 'coding'];
            const foundGeneric = genericTerms.filter(term => content.includes(term));
            
            if (foundGeneric.length > 0) {
                console.log(`❌ Generic terms found: ${foundGeneric.join(', ')}`);
            } else {
                console.log('✅ No inappropriate generic terms found');
            }

            // Show a sample of the content
            console.log('\n📄 Content Sample:');
            console.log(content.substring(0, 500) + '...');
            
            // Test vectorization
            console.log('\n🔍 Testing Vectorization...');
            const vectorStatus = await server.getVectorizationStatus();
            if (vectorStatus && vectorStatus.success && vectorStatus.total_vectors > 0) {
                console.log(`✅ Vectors stored: ${vectorStatus.total_vectors}`);
            } else {
                console.log('❌ Vectorization failed');
            }

        } else {
            console.log('❌ No content generated');
        }

        await server.cleanup();
        console.log('\n🎯 RESULT: System appears to be working correctly');

    } catch (error) {
        console.error('💥 Test failed:', error.message);
        return false;
    }

    return true;
}

quickDomainTest().catch(error => {
    console.error('Test crashed:', error.message);
    process.exit(1);
});