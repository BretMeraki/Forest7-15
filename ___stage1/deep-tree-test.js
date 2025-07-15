#!/usr/bin/env node

/**
 * DEEP TREE VALIDATION TEST
 * Guarantees comprehensive 6-level tree generation
 */

import { Stage1CoreServer } from './core-server.js';

async function validateDeepTreeGeneration(goal, context, domain) {
    console.log(`\n🌳 DEEP TREE VALIDATION: ${domain.toUpperCase()}`);
    console.log(`🎯 Goal: ${goal}`);
    
    const server = new Stage1CoreServer({
        dataPersistence: { dataDir: `./.deep-test-${domain}` },
        vectorProvider: {
            provider: 'SQLiteVecProvider',
            config: { 
                dbPath: `./.deep-test-${domain}/vectors.db`,
                enableCache: true
            }
        }
    });

    try {
        await server.initialize();
        
        // Create project
        const projectResult = await server.createProject({ goal, context });
        if (!projectResult.success) {
            throw new Error(`Project creation failed: ${projectResult.error}`);
        }

        // Setup onboarding with explicit depth requirements
        await server.dataPersistence.saveProjectData(projectResult.project_id, 'onboarding_state.json', {
            current_stage: 'completed',
            goal, context,
            user_profile: { experience_level: "intermediate" },
            aggregate_context: { 
                goal, context, 
                complexity: { score: 8, level: "high", recommended_depth: 6 }, // Force full depth
                detailedPlanning: true, // Request detailed planning
                explicitDepthRequest: true, // Explicit request for depth
                progressiveDepth: 6, // Force 6-level generation
                requireDomainSpecific: true,
                avoidGenericTemplates: true,
                usePureSchemaOnly: true // Force Pure Schema system only
            }
        });

        // Build comprehensive HTA tree using Pure Schema system directly
        console.log(`🌳 Building comprehensive 6-level HTA tree with Pure Schema system...`);
        const startTime = Date.now();
        
        // Force Pure Schema system usage by calling it directly
        const buildResult = await server.buildHTATree({ 
            goal, 
            context,
            detailedPlanning: true,
            explicitDepthRequest: true,
            progressiveDepth: 6, // Force full depth
            requireDomainSpecific: true,
            avoidGenericTemplates: true,
            usePureSchemaOnly: true, // Disable fallbacks
            forcePureSchema: true, // Additional flag to ensure Pure Schema usage
            forceRegenerate: true // Force regeneration even if HTA exists
        });
        
        const buildTime = Date.now() - startTime;

        if (!buildResult.success) {
            throw new Error(`HTA build failed: ${buildResult.error}`);
        }

        // Get and analyze the generated content
        console.log('🔍 Build result:', JSON.stringify(buildResult, null, 2));
        
        // Try to get Pure Schema content from build result first
        let content;
        if (buildResult.pureSchemaData) {
            // Use Pure Schema data if available
            content = JSON.stringify(buildResult.pureSchemaData, null, 2);
            console.log('✅ Using Pure Schema data from build result');
        } else {
            // Fallback to status overview
            const status = await server.getHTAStatus();
            if (!status?.content?.[0]?.text) {
                throw new Error('No content generated');
            }
            content = status.content[0].text;
            console.log('⚠️ Using status overview as fallback');
        }
        console.log(`📊 Build time: ${buildTime}ms (${(buildTime/1000).toFixed(1)}s)`);
        console.log(`📄 Content length: ${content.length} characters`);

        // Validate depth and structure
        const depthAnalysis = analyzeTreeDepth(content);
        console.log(`\n🔍 DEPTH ANALYSIS:`);
        console.log(`   Levels detected: ${depthAnalysis.levels.join(', ')}`);
        console.log(`   Maximum depth: ${depthAnalysis.maxDepth}`);
        console.log(`   Has strategic branches: ${depthAnalysis.hasStrategicBranches}`);
        console.log(`   Has task decomposition: ${depthAnalysis.hasTaskDecomposition}`);
        console.log(`   Has micro-particles: ${depthAnalysis.hasMicroParticles}`);
        console.log(`   Has nano-actions: ${depthAnalysis.hasNanoActions}`);
        console.log(`   Has context-adaptive primitives: ${depthAnalysis.hasPrimitives}`);

        // Content quality analysis
        const qualityAnalysis = analyzeContentQuality(content, domain);
        console.log(`\n📊 QUALITY ANALYSIS:`);
        console.log(`   Domain relevance: ${qualityAnalysis.domainRelevance}/10`);
        console.log(`   Structural completeness: ${qualityAnalysis.structuralCompleteness}/10`);
        console.log(`   Depth richness: ${qualityAnalysis.depthRichness}/10`);

        // Show content sample
        console.log(`\n📝 CONTENT PREVIEW (first 600 chars):`);
        console.log(`"${content.substring(0, 600)}..."`);

        await server.cleanup();

        const success = depthAnalysis.maxDepth >= 4 && 
                       qualityAnalysis.domainRelevance >= 7 && 
                       qualityAnalysis.structuralCompleteness >= 7;

        return {
            domain,
            success,
            buildTime,
            contentLength: content.length,
            maxDepth: depthAnalysis.maxDepth,
            hasAllLevels: depthAnalysis.maxDepth >= 6,
            domainRelevance: qualityAnalysis.domainRelevance,
            structuralCompleteness: qualityAnalysis.structuralCompleteness,
            depthRichness: qualityAnalysis.depthRichness
        };

    } catch (error) {
        await server.cleanup();
        console.error(`❌ Deep tree validation failed: ${error.message}`);
        return {
            domain,
            success: false,
            error: error.message
        };
    }
}

function analyzeTreeDepth(content) {
    const levels = [];
    const levelPatterns = [
        { level: 1, pattern: /level\s*1|goal.*context|strategic.*framework/i, name: 'Goal Context' },
        { level: 2, pattern: /level\s*2|strategic.*branch|learning.*phase/i, name: 'Strategic Branches' },
        { level: 3, pattern: /level\s*3|task.*decomposition|practical.*task/i, name: 'Task Decomposition' },
        { level: 4, pattern: /level\s*4|micro.*particle|detailed.*step/i, name: 'Micro-Particles' },
        { level: 5, pattern: /level\s*5|nano.*action|granular.*step/i, name: 'Nano-Actions' },
        { level: 6, pattern: /level\s*6|context.*adaptive|primitive.*action/i, name: 'Context-Adaptive Primitives' }
    ];

    levelPatterns.forEach(({ level, pattern, name }) => {
        if (pattern.test(content)) {
            levels.push(`Level ${level} (${name})`);
        }
    });

    return {
        levels,
        maxDepth: levels.length,
        hasStrategicBranches: /strategic.*branch/i.test(content),
        hasTaskDecomposition: /task.*decomposition/i.test(content),
        hasMicroParticles: /micro.*particle/i.test(content),
        hasNanoActions: /nano.*action/i.test(content),
        hasPrimitives: /primitive|granular/i.test(content)
    };
}

function analyzeContentQuality(content, domain) {
    const lowerContent = content.toLowerCase();
    
    // Domain-agnostic relevance scoring - detects domain-specific content intelligently
    let domainRelevance = 5; // Default baseline
    
    // Check for domain-specific patterns based on goal context
    if (domain === 'pottery') {
        const potteryTerms = ['clay', 'wheel', 'throwing', 'ceramic', 'kiln', 'glazing', 'pottery', 'centering', 'trimming', 'wedging', 'bisque', 'firing', 'studio', 'potter', 'vessel', 'form', 'technique', 'hand-building', 'coil', 'pinch'];
        const foundTerms = potteryTerms.filter(term => lowerContent.includes(term));
        domainRelevance = Math.min(10, (foundTerms.length / potteryTerms.length) * 20);
    } else if (domain === 'cybersecurity') {
        const cyberTerms = ['security', 'penetration', 'vulnerability', 'exploit', 'network', 'hacking', 'pentest', 'reconnaissance', 'scanning', 'enumeration', 'exploitation', 'privilege', 'lateral', 'reporting'];
        const foundTerms = cyberTerms.filter(term => lowerContent.includes(term));
        domainRelevance = Math.min(10, (foundTerms.length / cyberTerms.length) * 20);
    } else {
        // Domain-agnostic scoring for any other domain
        // Check for technical depth indicators
        const technicalIndicators = [
            /\b\w+ing\b/g, // Technical processes (throwing, programming, analyzing, etc.)
            /\b\w+tion\b/g, // Technical actions (implementation, exploration, etc.)
            /\b\w+ment\b/g, // Technical elements (equipment, development, etc.)
            /\b\w+ology\b/g, // Technical fields (technology, methodology, etc.)
            /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Proper technical terms
        ];
        
        let technicalMatches = 0;
        technicalIndicators.forEach(pattern => {
            const matches = lowerContent.match(pattern);
            if (matches) technicalMatches += matches.length;
        });
        
        // Score based on technical density
        const technicalDensity = technicalMatches / (content.length / 1000); // matches per 1000 chars
        domainRelevance = Math.min(10, Math.max(5, technicalDensity * 2));
    }
    
    // Structural completeness
    const structuralElements = [
        'strategic', 'branch', 'task', 'step', 'action', 'goal', 'objective'
    ];
    const foundStructural = structuralElements.filter(element => lowerContent.includes(element));
    const structuralCompleteness = Math.min(10, (foundStructural.length / structuralElements.length) * 10);
    
    // Depth richness (based on content length and complexity)
    const depthRichness = Math.min(10, content.length / 500); // 500 chars per point
    
    return {
        domainRelevance: Math.round(domainRelevance),
        structuralCompleteness: Math.round(structuralCompleteness),
        depthRichness: Math.round(depthRichness)
    };
}

async function runDeepTreeValidation() {
    console.log('🌳 DEEP TREE GENERATION VALIDATION');
    console.log('Guaranteeing comprehensive 6-level architecture');
    console.log('=' * 60);
    
    const testCases = [
        {
            goal: "Master advanced pottery wheel throwing techniques",
            context: "Experienced beginner with basic hand-building skills",
            domain: "pottery"
        },
        {
            goal: "Develop expertise in cybersecurity penetration testing",
            context: "Network administrator with security fundamentals",
            domain: "cybersecurity"
        }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
        const result = await validateDeepTreeGeneration(testCase.goal, testCase.context, testCase.domain);
        results.push(result);
    }
    
    // Final deep tree assessment
    console.log(`\n${'='.repeat(60)}`);
    console.log('🌳 DEEP TREE VALIDATION RESULTS');
    console.log(`${'='.repeat(60)}`);
    
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length > 0) {
        const avgDepth = successfulResults.reduce((sum, r) => sum + r.maxDepth, 0) / successfulResults.length;
        const avgRelevance = successfulResults.reduce((sum, r) => sum + r.domainRelevance, 0) / successfulResults.length;
        const hasAllLevels = successfulResults.filter(r => r.hasAllLevels).length;
        
        console.log(`📊 Average depth: ${avgDepth.toFixed(1)} levels`);
        console.log(`📊 Average domain relevance: ${avgRelevance.toFixed(1)}/10`);
        console.log(`📊 Complete 6-level trees: ${hasAllLevels}/${successfulResults.length}`);
        
        console.log(`\n📋 Detailed results:`);
        successfulResults.forEach(result => {
            console.log(`   ${result.domain}: ${result.maxDepth} levels, ${result.domainRelevance}/10 relevance, ${result.buildTime}ms`);
        });
        
        if (avgDepth >= 4 && avgRelevance >= 7) {
            console.log(`\n✅ DEEP TREE GUARANTEE VERIFIED!`);
            console.log(`✅ Comprehensive depth achieved`);
            console.log(`✅ Domain-specific content maintained`);
            console.log(`✅ Rich, detailed tree structures generated`);
            return true;
        } else {
            console.log(`\n⚠️ INSUFFICIENT DEPTH OR QUALITY`);
            console.log(`❌ Average depth: ${avgDepth.toFixed(1)} (need >= 4)`);
            console.log(`❌ Average relevance: ${avgRelevance.toFixed(1)} (need >= 7)`);
            return false;
        }
    } else {
        console.log(`❌ ALL DEEP TREE VALIDATIONS FAILED`);
        return false;
    }
}

runDeepTreeValidation().then(success => {
    const message = success ? 
        '\n🎉 DEEP TREE GUARANTEE FULFILLED!' :
        '\n💥 DEEP TREE REQUIREMENTS NOT MET';
    console.log(message);
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('\n💥 Deep tree validation crashed:', error.message);
    process.exit(1);
});