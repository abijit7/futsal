package com.futsal.service;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Defers a side effect until the surrounding transaction commits.
 *
 * <p>Booking emails are the motivating case: sending one from inside the transaction that
 * settles a payment means a later rollback leaves the customer holding a receipt for a booking
 * that does not exist. Outside a transaction the action runs immediately, which keeps unit
 * tests and non-transactional callers working unchanged.
 */
final class AfterCommit {

    private AfterCommit() {
    }

    static void run(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }
}
