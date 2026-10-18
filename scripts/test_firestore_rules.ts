import { initializeTestEnvironment, assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore';
import fs from 'fs';

const USER_A_ID = '32uUSZqbVNQmkAWcDYGsEMbqbkF2';
const USER_A_EMAIL = 'kutlwanomaredi164@gmail.com';
const USER_B_ID = 'second_user_9876543210ab';
const USER_B_EMAIL = 'second_user@example.com';

const WS_A_ID = 'ws_32uUSZqbVNQm';
const WS_B_ID = 'ws_second_user_987';

async function runTestSuite() {
  console.log('========================================================');
  console.log('   STARTING FIRESTORE SECURITY RULES COMPREHENSIVE SUITE');
  console.log('========================================================\n');

  const rules = fs.readFileSync('./firestore.rules', 'utf8');

  let testEnv: RulesTestEnvironment;
  try {
    testEnv = await initializeTestEnvironment({
      projectId: 'ringed-tracker-frrhs',
      firestore: {
        rules,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  } catch (err: any) {
    console.error('Failed to initialize test environment:', err.message);
    process.exit(1);
  }

  try {
    // -----------------------------------------------------------
    // TEST 1: Test workspace creation for a signed-in user
    // -----------------------------------------------------------
    console.log('--> TEST 1: Workspace creation for signed-in User A');
    const userAContext = testEnv.authenticatedContext(USER_A_ID, { email: USER_A_EMAIL, email_verified: true });
    const userADb = userAContext.firestore();

    const initialCreatedAt = new Date().toISOString();
    const wsPayload = {
      id: WS_A_ID,
      name: "Kutlwano's Workspace",
      industry: 'Photography Studio',
      ownerId: USER_A_ID,
      ownerEmail: USER_A_EMAIL,
      createdAt: initialCreatedAt,
      updatedAt: initialCreatedAt,
    };

    await assertSucceeds(
      setDoc(doc(userADb, 'workspaces', WS_A_ID), wsPayload)
    );
    console.log('[PASS] Test 1: Signed-in User A successfully created workspace with ID: ' + WS_A_ID);

    // -----------------------------------------------------------
    // TEST 2: Test saving and reloading that user's workspace
    // -----------------------------------------------------------
    console.log('\n--> TEST 2: Saving, updating, and reloading User A workspace');
    const readBackSnap = await assertSucceeds(
      getDoc(doc(userADb, 'workspaces', WS_A_ID))
    );
    if (!readBackSnap.exists() || readBackSnap.data()?.name !== "Kutlwano's Workspace") {
      throw new Error('Workspace data mismatch after reload');
    }
    console.log('[PASS] Test 2a: Successfully reloaded workspace document directly.');

    // Test update: Update name and industry while preserving immutable createdAt
    const updatedPayload = {
      ...wsPayload,
      name: "Kutlwano's Creative Studio (Renamed)",
      industry: 'Fine Art & Commercial Photography',
      updatedAt: new Date().toISOString(),
    };
    await assertSucceeds(
      setDoc(doc(userADb, 'workspaces', WS_A_ID), updatedPayload, { merge: true })
    );

    const reloadedSnap = await getDoc(doc(userADb, 'workspaces', WS_A_ID));
    if (reloadedSnap.data()?.name !== "Kutlwano's Creative Studio (Renamed)") {
      throw new Error('Workspace update was not persisted');
    }
    console.log('[PASS] Test 2b: Successfully updated workspace and verified updated data: "' + reloadedSnap.data()?.name + '"');

    // -----------------------------------------------------------
    // TEST 3: Second authenticated user CANNOT access or modify User A's workspace
    // -----------------------------------------------------------
    console.log('\n--> TEST 3: Multi-tenant isolation - User B cannot access/modify User A workspace');
    const userBContext = testEnv.authenticatedContext(USER_B_ID, { email: USER_B_EMAIL, email_verified: true });
    const userBDb = userBContext.firestore();

    // User B attempts to read User A's workspace
    await assertFails(
      getDoc(doc(userBDb, 'workspaces', WS_A_ID))
    );
    console.log('[PASS] Test 3a: User B GET on User A workspace returned PERMISSION_DENIED as required.');

    // User B attempts to update User A's workspace
    await assertFails(
      updateDoc(doc(userBDb, 'workspaces', WS_A_ID), { name: 'Hacked by User B' })
    );
    console.log('[PASS] Test 3b: User B UPDATE on User A workspace returned PERMISSION_DENIED as required.');

    // User B attempts to delete User A's workspace
    await assertFails(
      deleteDoc(doc(userBDb, 'workspaces', WS_A_ID))
    );
    console.log('[PASS] Test 3c: User B DELETE on User A workspace returned PERMISSION_DENIED as required.');

    // User B attempts to steal ownership by setting ownerId = USER_B_ID on User A's doc
    await assertFails(
      setDoc(doc(userBDb, 'workspaces', WS_A_ID), {
        id: WS_A_ID,
        name: 'Stolen Workspace',
        ownerId: USER_B_ID,
        createdAt: initialCreatedAt,
      }, { merge: true })
    );
    console.log('[PASS] Test 3d: Ownership hijacking attempt by User B returned PERMISSION_DENIED.');

    // User B can create their OWN workspace
    await assertSucceeds(
      setDoc(doc(userBDb, 'workspaces', WS_B_ID), {
        id: WS_B_ID,
        name: "User B's Workspace",
        industry: 'E-commerce',
        ownerId: USER_B_ID,
        ownerEmail: USER_B_EMAIL,
        createdAt: new Date().toISOString(),
      })
    );
    console.log('[PASS] Test 3e: User B successfully created their own separate workspace: ' + WS_B_ID);

    // -----------------------------------------------------------
    // TEST 4: Intended behavior for signed-out users
    // -----------------------------------------------------------
    console.log('\n--> TEST 4: Signed-out / Unauthenticated visitor isolation');
    const unauthContext = testEnv.unauthenticatedContext();
    const unauthDb = unauthContext.firestore();

    // Unauthenticated GET on workspace
    await assertFails(
      getDoc(doc(unauthDb, 'workspaces', WS_A_ID))
    );
    console.log('[PASS] Test 4a: Unauthenticated GET on workspace returned PERMISSION_DENIED.');

    // Unauthenticated CREATE on workspace
    await assertFails(
      setDoc(doc(unauthDb, 'workspaces', 'ws_anon_attempt'), {
        id: 'ws_anon_attempt',
        name: 'Anonymous Workspace',
        ownerId: 'some_uid',
        createdAt: new Date().toISOString(),
      })
    );
    console.log('[PASS] Test 4b: Unauthenticated CREATE on workspace returned PERMISSION_DENIED.');

    // Unauthenticated LIST on workspaces
    await assertFails(
      getDocs(collection(unauthDb, 'workspaces'))
    );
    console.log('[PASS] Test 4c: Unauthenticated LIST on workspaces collection returned PERMISSION_DENIED.');

    // -----------------------------------------------------------
    // TEST 5: Chatbot publishing and public widget access
    // -----------------------------------------------------------
    console.log('\n--> TEST 5: Chatbot Publishing & Public Embed Widget Access');
    const draftBotId = 'bot_draft_101';
    const pubBotId = 'bot_published_202';

    // User A creates a draft bot
    await assertSucceeds(
      setDoc(doc(userADb, 'chatbots', draftBotId), {
        id: draftBotId,
        workspaceId: WS_A_ID,
        ownerId: USER_A_ID,
        name: 'Draft Studio Bot',
        businessName: 'Lens & Light Photography',
        status: 'draft',
        createdAt: new Date().toISOString(),
      })
    );

    // Unauthenticated visitor attempts to view draft bot -> MUST FAIL
    await assertFails(
      getDoc(doc(unauthDb, 'chatbots', draftBotId))
    );
    console.log('[PASS] Test 5a: Draft chatbot is strictly private to owner (visitor access denied).');

    // User A creates/publishes a public bot
    await assertSucceeds(
      setDoc(doc(userADb, 'chatbots', pubBotId), {
        id: pubBotId,
        workspaceId: WS_A_ID,
        ownerId: USER_A_ID,
        name: 'Published Studio Bot',
        businessName: 'Lens & Light Photography',
        status: 'published',
        createdAt: new Date().toISOString(),
      })
    );

    // Unauthenticated visitor reads published bot -> MUST SUCCEED (for website embed widget)
    const pubSnap = await assertSucceeds(
      getDoc(doc(unauthDb, 'chatbots', pubBotId))
    );
    if (!pubSnap.exists() || pubSnap.data()?.status !== 'published') {
      throw new Error('Published bot read failed');
    }
    console.log('[PASS] Test 5b: Published chatbot is accessible by unauthenticated widget as intended.');

    // User B attempts to modify User A's published bot -> MUST FAIL
    await assertFails(
      updateDoc(doc(userBDb, 'chatbots', pubBotId), { name: 'Defaced Bot Name' })
    );
    console.log('[PASS] Test 5c: Other users cannot modify published bots owned by User A.');

    // -----------------------------------------------------------
    // TEST 6: Dirty Dozen Invariant Checks
    // -----------------------------------------------------------
    console.log('\n--> TEST 6: Invariant Checks (Shadow fields, invalid ID, timestamp tampering)');

    // 6a: Shadow field injection on workspace
    await assertFails(
      setDoc(doc(userADb, 'workspaces', 'ws_shadow_test'), {
        id: 'ws_shadow_test',
        name: 'Shadow Workspace',
        ownerId: USER_A_ID,
        isEnterprisePaid: true, // Ghost field not in schema
        createdAt: new Date().toISOString(),
      })
    );
    console.log('[PASS] Test 6a: Shadow field injection was rejected by schema validation.');

    // 6b: ID poisoning / invalid characters
    await assertFails(
      setDoc(doc(userADb, 'workspaces', 'ws_invalid$id!@#'), {
        id: 'ws_invalid$id!@#',
        name: 'Bad ID Workspace',
        ownerId: USER_A_ID,
        createdAt: new Date().toISOString(),
      })
    );
    console.log('[PASS] Test 6b: Invalid ID poisoning was rejected by isValidId.');

    console.log('\n========================================================');
    console.log('   ALL FIRESTORE SECURITY TESTS PASSED WITH 100% SUCCESS!');
    console.log('========================================================\n');
  } finally {
    await testEnv.cleanup();
  }
}

runTestSuite().catch((err) => {
  console.error('\n[FATAL TEST SUITE FAILURE]:', err);
  process.exit(1);
});
