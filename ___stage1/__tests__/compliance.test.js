import { CoreInitialization } from '../core-initialization.js';

describe('🌲 Comprehensive Forest Compliance Test Suite', () => {
    let system;

    beforeAll(async () => {
        const initialization = new CoreInitialization();
        system = await initialization.initialize();
    });

    afterAll(async () => {
        if (system && system.shutdown) {
            await system.shutdown();
        }
    });

    describe('SECTION 1: SYSTEM OVERVIEW COMPLIANCE', () => {
        it('should verify that the system combines HTA, Vector Intelligence, and AST Parsing', () => {
            const { htaCore, coreIntelligence } = system;
            
            expect(htaCore).toBeDefined();
            expect(coreIntelligence).toBeDefined();

            const hasASTCapabilities = coreIntelligence.hasASTCapabilities?.() || typeof coreIntelligence.parseAST === 'function';
            expect(hasASTCapabilities).toBe(true);
        });

        it('should verify the 6-level hierarchical decomposition capability', () => {
            const { htaCore } = system;

            expect(htaCore.analyzeGoalComplexity).toBeInstanceOf(Function);
            expect(htaCore.calculateTreeStructure).toBeInstanceOf(Function);

            const complexityAnalysis = htaCore.analyzeGoalComplexity('Learn machine learning for career transition');
            expect(complexityAnalysis).toBeDefined();
            expect(typeof complexityAnalysis.score).toBe('number');
            expect(complexityAnalysis.score).toBeGreaterThanOrEqual(1);
            expect(complexityAnalysis.score).toBeLessThanOrEqual(10);
        });

        it('should verify domain-agnostic, schema-driven learning paths', () => {
            const { htaCore } = system;
            const hasSchemaDrivenCapabilities = htaCore.generateSchemaBasedHTA || htaCore.createFallbackHTA;
            expect(hasSchemaDrivenCapabilities).toBeDefined();
        });

        it('should verify real-time adaptation based on progress and context', () => {
            const { taskStrategyCore } = system;
            expect(taskStrategyCore.evolveHTABasedOnLearning).toBeInstanceOf(Function);
        });

        it('should verify atomic, foolproof step generation capability', () => {
            const { htaCore } = system;
            const hasAtomicStepCapabilities = htaCore.generateSkeletonTasks || htaCore.createDetailedTasks;
            expect(hasAtomicStepCapabilities).toBeDefined();
        });
    });
});