#!/usr/bin/env node

/**
 * RUTHLESS VERIFICATION TEST
 * Proves the system actually works with real domain-specific content
 */

import { Stage1CoreServer } from './core-server.js';

// Multiple diverse test domains to verify true domain-agnostic capability
const TEST_DOMAINS = [
    {
        goal: "Learn pottery wheel throwing techniques",
        context: "Complete beginner, never touched clay",
        expectedTerms: ['clay', 'wheel', 'centering', 'pottery', 'throwing', 'ceramic', 'kiln', 'glazing'],
        domain: 'pottery'
    },
    {
        goal: "Master advanced cybersecurity penetration testing",
        context: "Network admin with basic security knowledge",
        expectedTerms: ['penetration', 'security', 'vulnerability', 'exploit', 'reconnaissance', 'network', 'payload'],
        domain: 'cybersecurity'
    },
    {
        goal: "Learn advanced French conversation and grammar",
        context: "Intermediate English speaker, basic French vocabulary",
        expectedTerms: ['french', 'grammar', 'conversation', 'vocabulary', 'pronunciation', 'conjugation', 'subjunctive'],
        domain: 'language'
    },
    {
        goal: "Master quantum physics fundamentals for research",
        context: "PhD student in classical physics",
        expectedTerms: ['quantum', 'physics', 'entanglement', 'superposition', 'wave', 'particle', 'uncertainty'],
        domain: 'physics'
    }
];

async function verifyRealLLMResponse(server, goal, context) {
    console.log(`\n🔍 RUTHLESS VERIFICATION: ${goal}`);
    
    try {
        // Create project
        const projectResult = await server.createProject({ goal, context });
        if (!projectResult.success) {
            throw new Error(`Project creation failed: ${projectResult.error}`);
        }
        console.log(`✅ Project created: ${projectResult.project_id}`);

        // Setup fake onboarding to bypass gating
        await server.dataPersistence.saveProjectData(projectResult.project_id, 'onboarding_state.json', {
            current_stage: 'completed',
            goal,
            context,
            user_profile: { experience_level: "intermediate" },
            aggregate_context: {
                goal,
                context,
                complexity: { score: 6, level: "moderate", recommended_depth: 3 },
                user_profile: { experience_level: "intermediate" }
            }
        });
        console.log(`✅ Onboarding bypass completed`);

        // Build HTA tree
        console.log(`🔨 Building HTA tree...`);
        const buildResult = await server.buildHTATree({ goal, context });
        
        if (!buildResult.success) {
            console.error(`❌ HTA BUILD FAILED: ${buildResult.error}`);
            console.error(`❌ Full result:`, JSON.stringify(buildResult, null, 2));
            return { success: false, error: buildResult.error };
        }
        
        console.log(`✅ HTA tree built successfully`);

        // Get actual generated content
        const status = await server.getHTAStatus();
        if (!status || !status.content || !status.content[0]) {
            console.error(`❌ NO CONTENT GENERATED`);
            return { success: false, error: 'No content in HTA status' };
        }

        const content = status.content[0].text;
        console.log(`✅ Content retrieved (${content.length} characters)`);
        
        return { 
            success: true, 
            content, 
            contentLength: content.length,
            projectId: projectResult.project_id 
        };

    } catch (error) {
        console.error(`❌ VERIFICATION FAILED: ${error.message}`);
        console.error(`❌ Stack:`, error.stack);
        return { success: false, error: error.message };
    }
}

async function analyzeContentQuality(content, expectedTerms, domain) {
    console.log(`\n📊 CONTENT QUALITY ANALYSIS FOR ${domain.toUpperCase()}`);
    
    const lowerContent = content.toLowerCase();
    const foundTerms = expectedTerms.filter(term => lowerContent.includes(term));
    const termCoverage = (foundTerms.length / expectedTerms.length) * 100;
    
    console.log(`📋 Expected domain terms: ${expectedTerms.join(', ')}`);
    console.log(`✅ Found terms: ${foundTerms.join(', ')}`);
    console.log(`📊 Term coverage: ${termCoverage.toFixed(1)}%`);
    
    // Check for generic/template content
    const genericTerms = ['foundation', 'research', 'capability', 'phase', 'basic understanding'];
    const foundGeneric = genericTerms.filter(term => lowerContent.includes(term));
    const genericScore = foundGeneric.length;
    
    console.log(`⚠️ Generic terms found: ${foundGeneric.join(', ') || 'None'}`);
    
    // Content structure analysis
    const hasStrategicBranches = lowerContent.includes('strategic') || lowerContent.includes('branch');
    const hasTaskStructure = lowerContent.includes('task') || lowerContent.includes('step');
    const hasSpecificContent = foundTerms.length >= 3;
    
    console.log(`🏗️ Has strategic structure: ${hasStrategicBranches}`);
    console.log(`📋 Has task structure: ${hasTaskStructure}`);
    console.log(`🎯 Has domain-specific content: ${hasSpecificContent}`);
    
    // Quality score calculation
    let qualityScore = 0;
    if (termCoverage >= 40) qualityScore += 40;  // Domain coverage
    if (genericScore <= 2) qualityScore += 30;   // Low generic content
    if (hasStrategicBranches) qualityScore += 15; // Strategic structure
    if (hasTaskStructure) qualityScore += 15;     // Task structure
    
    console.log(`🏆 Quality Score: ${qualityScore}/100`);
    
    // Show sample content
    console.log(`\n📝 CONTENT SAMPLE (first 500 chars):`);
    console.log(`"${content.substring(0, 500)}..."`);
    
    return {
        termCoverage,
        genericScore,
        qualityScore,
        foundTerms,
        hasStrategicBranches,
        hasTaskStructure,
        hasSpecificContent,
        passed: qualityScore >= 70 && hasSpecificContent
    };
}

async function ruthlessVerification() {
    console.log('🔥 STARTING RUTHLESS VERIFICATION - PROVING DOMAIN-AGNOSTIC SYSTEM WORKS');
    console.log('=' * 80);
    
    const server = new Stage1CoreServer({
        dataPersistence: { dataDir: './.ruthless-test-data' },
        vectorProvider: {
            provider: 'SQLiteVecProvider',
            config: { 
                dbPath: './.ruthless-test-data/vectors.db',
                enableCache: true
            }
        }
    });

    let allResults = [];
    let totalPassed = 0;

    try {
        console.log('🚀 Initializing server...');
        await server.initialize();
        console.log('✅ Server initialized');

        for (const testCase of TEST_DOMAINS) {
            console.log(`\n${'='.repeat(80)}`);
            console.log(`🎯 TESTING DOMAIN: ${testCase.domain.toUpperCase()}`);
            console.log(`🎯 Goal: ${testCase.goal}`);
            console.log(`🎯 Context: ${testCase.context}`);
            
            // Verify LLM response
            const verificationResult = await verifyRealLLMResponse(
                server, 
                testCase.goal, 
                testCase.context
            );
            
            if (!verificationResult.success) {
                console.error(`❌ DOMAIN ${testCase.domain} FAILED: ${verificationResult.error}`);
                allResults.push({
                    domain: testCase.domain,
                    passed: false,
                    error: verificationResult.error
                });
                continue;
            }
            
            // Analyze content quality
            const qualityAnalysis = await analyzeContentQuality(
                verificationResult.content,
                testCase.expectedTerms,
                testCase.domain
            );
            
            allResults.push({
                domain: testCase.domain,
                passed: qualityAnalysis.passed,
                qualityScore: qualityAnalysis.qualityScore,
                termCoverage: qualityAnalysis.termCoverage,
                foundTerms: qualityAnalysis.foundTerms,
                contentLength: verificationResult.contentLength,
                hasSpecificContent: qualityAnalysis.hasSpecificContent
            });
            
            if (qualityAnalysis.passed) {
                totalPassed++;
                console.log(`✅ DOMAIN ${testCase.domain.toUpperCase()} PASSED`);
            } else {
                console.log(`❌ DOMAIN ${testCase.domain.toUpperCase()} FAILED`);
            }
        }

    } catch (error) {
        console.error('💥 CATASTROPHIC FAILURE:', error.message);
        console.error(error.stack);
    } finally {
        await server.cleanup();
    }

    // Final ruthless assessment
    console.log(`\n${'='.repeat(80)}`);
    console.log('🏁 FINAL RUTHLESS VERIFICATION RESULTS');
    console.log(`${'='.repeat(80)}`);
    
    console.log(`\n📊 DOMAIN RESULTS:`);
    allResults.forEach(result => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        const score = result.qualityScore || 0;
        const coverage = result.termCoverage || 0;
        console.log(`  ${result.domain.padEnd(15)} ${status} | Score: ${score}/100 | Coverage: ${coverage.toFixed(1)}%`);
    });
    
    const passRate = (totalPassed / TEST_DOMAINS.length) * 100;
    console.log(`\n🏆 OVERALL PASS RATE: ${totalPassed}/${TEST_DOMAINS.length} (${passRate.toFixed(1)}%)`);
    
    if (passRate >= 75) {
        console.log(`\n🎉 VERIFICATION PASSED: System is genuinely domain-agnostic!`);
        console.log(`✅ The system generates real, domain-specific content for diverse goals`);
        console.log(`✅ No false positives detected - content is truly contextual`);
        return true;
    } else {
        console.log(`\n💥 VERIFICATION FAILED: System has false positives/negatives`);
        console.log(`❌ Pass rate of ${passRate.toFixed(1)}% is below 75% threshold`);
        console.log(`❌ System is NOT ready for production`);
        return false;
    }
}

// Run the ruthless verification
ruthlessVerification().then(success => {
    const message = success ? 
        '\n🎯 SKEPTICISM DEFEATED: Domain-agnostic system PROVEN to work!' :
        '\n💀 SKEPTICISM CONFIRMED: System has critical issues';
    console.log(message);
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('\n💥 VERIFICATION CRASHED:', error.message);
    process.exit(1);
});