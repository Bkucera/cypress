/* eslint prefer-rest-params: "off", no-console: "off", arrow-body-style: "off"*/

const { $, _ } = Cypress
const helpers = require('../../support/helpers')
const sinon = require('sinon')

/**
 * @type {sinon.SinonMatch}
 */
const match = Cypress.sinon.match
const { stringify } = require('../../support/matchDeep')
// const m = match

const { defer } = helpers

const backupCy = window.cy
const backupCypress = window.Cypress

backupCy.__original__ = true

/**
   * @type {sinon.SinonStub}
   */
let allStubs

window.lastActual = 'none'

// Cypress.env('RETRIES', 4)

$(document).ready(() => {
  if ($('#snapshot-copy-btn', window.top.document).length) {
    return
  }

  const btn = $('<span id="snapshot-copy-btn"><button>COPY</button></span>', window.top.document)
  const container = $(
    '.toggle-auto-scrolling.auto-scrolling-enabled',
    window.top.document
  ).closest('.controls')

  btn.on('click', () => {
    console.log('%cCopied to clipboard', 'color:grey')
    // console.log(lastActual)
    copyToClipboard(stringify(window.lastActual))
  })

  container.append(btn)
})

describe('src/cypress/runner', () => {

  describe('isolated test runner', () => {

    beforeEach(async () => {
      window.cy = backupCy
      window.Cypress = backupCypress

      await new Cypress.Promise((res) => {
        // cy.wait(1000)
        cy.visit('/fixtures/generic.html').then(res)
      })
    })

    describe('test events', function () {
    // it('empty', () => {})

      it('simple 1', () => {
        return createCypress({
          suites: { 'suite 1': { tests: [{ name: 'test 1' }] } },
        })
        .call('run')
        .then(shouldHaveFailed(0))
        .then(() => {

          expect(formatEvents(allStubs)).to.deep.eq([
            ['run:start'],
            [
              'test:before:run',
              {
                'id': 'r3',
                'title': 'test 1',
                'attemptIndex': 0,
                'final': true,
              },
            ],
            [
              'test:before:run:async',
              {
                'id': 'r3',
                'title': 'test 1',
                'attemptIndex': 0,
                'final': true,
              },
            ],
            [
              'runnable:after:run:async',
              {
                'id': 'r3',
                'title': 'test 1',
                'attemptIndex': 0,
                'final': true,
              },
            ],
            [
              'test:after:run',
              {
                'id': 'r3',
                'title': 'test 1',
                'state': 'passed',
                'attemptIndex': 0,
                'final': true,
              },
            ],
            ['run:end'],
          ])
        })
      })

      it('simple 3 tests', function () {
        return createCypress({
          suites: {
            'suite 1': { tests: ['test 1', 'test 2', 'test 3'] },
          },
        })
        .call('run')
        .then(shouldHaveFailed(0))
        .then(() => {
          expect(formatEvents(allStubs)).to.matchDeep([
            ['run:start'],
            [
              'test:before:run',
              {
                id: 'r3',
                title: 'test 1',
              },
            ],
            [
              'test:before:run:async',
              {
                id: 'r3',
                title: 'test 1',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: 'test 1',
              },
            ],
            [
              'test:after:run',
              {
                id: 'r3',
                title: 'test 1',
                state: 'passed',
              },
            ],
            [
              'test:before:run',
              {
                id: 'r4',
                title: 'test 2',
              },
            ],
            [
              'test:before:run:async',
              {
                id: 'r4',
                title: 'test 2',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r4',
                title: 'test 2',
              },
            ],
            [
              'test:after:run',
              {
                id: 'r4',
                title: 'test 2',
                state: 'passed',
              },
            ],
            [
              'test:before:run',
              {
                id: 'r5',
                title: 'test 3',
              },
            ],
            [
              'test:before:run:async',
              {
                id: 'r5',
                title: 'test 3',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r5',
                title: 'test 3',
              },
            ],
            [
              'test:after:run',
              {
                id: 'r5',
                title: 'test 3',
                state: 'passed',
              },
            ],
            ['run:end'],
          ])
        })
      })

      it('simple fail', function () {
        return createCypress({
          suites: {
            'suite 1': {
              tests: [
                {
                  name: 'test 1',
                  fail: true,
                },
              ],
            },
          },
        }).call('run')
        .then(shouldHaveFailed(1))
        .then(() => {
          expect(formatEvents(allStubs)).to.matchDeep([
            ['run:start'],
            [
              'test:before:run',
              {
                id: 'r3',
                title: 'test 1',
              },
            ],
            [
              'test:before:run:async',
              {
                id: 'r3',
                title: 'test 1',
              },
            ],
            ['fail', {}],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: 'test 1',
                err: '[Object]',
              },
            ],
            [
              'test:after:run',
              {
                id: 'r3',
                title: 'test 1',
                err: '[Object]',
                state: 'failed',
              },
            ],
            ['run:end'],
          ])
        })
      })

      it.only('pass fail pass fail', function () {
        return createCypress({
          suites: {
            'suite 1': {
              tests: [
                'test 1',
                {
                  name: 'test 2',
                  fail: true,
                },
              ],
            },
            'suite 2': {
              tests: [
                'test 1',
                {
                  name: 'test 2',
                  fail: true,
                },
              ],
            },
          },
        }).call('run')
        .then(shouldHaveFailed(2))
        .then(() => {

          expect(formatEvents(allStubs)).to.matchDeep({
            snapshots: stringifyShort,
            parent: stringifyShort,
            tests: stringifyShort,
            commands: stringifyShort,
            err: stringifyShort,
            body: '[body]',
            wallClockStartedAt: match.date,
            lifecycle: match.number,
            fnDuration: match.number,
            duration: match.number,
            afterFnDuration: match.number,
            wallClockDuration: match.number,

          }, [
            ['run:start'],
            [
              'test:before:run',
              {
                id: 'r3',
                title: 'test 1',
                body: '[body]',
                type: 'test',
                wallClockStartedAt: match.date,
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'test:before:run:async',
              {
                id: 'r3',
                title: 'test 1',
                body: '[body]',
                type: 'test',
                wallClockStartedAt: match.date,
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: 'test 1',
                body: '[body]',
                type: 'test',
                duration: match.number,
                wallClockStartedAt: match.date,
                timings: {
                  lifecycle: match.number,
                  test: {
                    fnDuration: match.number,
                    afterFnDuration: match.number,
                  },
                },
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'test:after:run',
              {
                id: 'r3',
                title: 'test 1',
                state: 'passed',
                body: '[body]',
                type: 'test',
                duration: match.number,
                wallClockStartedAt: match.date,
                wallClockDuration: match.number,
                timings: {
                  lifecycle: match.number,
                  test: {
                    fnDuration: match.number,
                    afterFnDuration: match.number,
                  },
                },
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'test:before:run',
              {
                id: 'r4',
                title: 'test 2',
                body: '[body]',
                type: 'test',
                wallClockStartedAt: match.date,
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'test:before:run:async',
              {
                id: 'r4',
                title: 'test 2',
                body: '[body]',
                type: 'test',
                wallClockStartedAt: match.date,
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'fail',
              {},
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r4',
                title: 'test 2',
                err: '{Object 3}',
                body: '[body]',
                type: 'test',
                duration: match.number,
                wallClockStartedAt: match.date,
                timings: {
                  lifecycle: match.number,
                  test: {
                    fnDuration: match.number,
                    afterFnDuration: match.number,
                  },
                },
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'test:after:run',
              {
                id: 'r4',
                title: 'test 2',
                err: '{Object 3}',
                state: 'failed',
                body: '[body]',
                type: 'test',
                duration: match.number,
                wallClockStartedAt: match.date,
                wallClockDuration: match.number,
                timings: {
                  lifecycle: match.number,
                  test: {
                    fnDuration: match.number,
                    afterFnDuration: match.number,
                  },
                },
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'test:before:run',
              {
                id: 'r6',
                title: 'test 1',
                body: '[body]',
                type: 'test',
                wallClockStartedAt: match.date,
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'test:before:run:async',
              {
                id: 'r6',
                title: 'test 1',
                body: '[body]',
                type: 'test',
                wallClockStartedAt: match.date,
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r6',
                title: 'test 1',
                body: '[body]',
                type: 'test',
                duration: match.number,
                wallClockStartedAt: match.date,
                timings: {
                  lifecycle: match.number,
                  test: {
                    fnDuration: match.number,
                    afterFnDuration: match.number,
                  },
                },
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'test:after:run',
              {
                id: 'r6',
                title: 'test 1',
                state: 'passed',
                body: '[body]',
                type: 'test',
                duration: match.number,
                wallClockStartedAt: match.date,
                wallClockDuration: match.number,
                timings: {
                  lifecycle: match.number,
                  test: {
                    fnDuration: match.number,
                    afterFnDuration: match.number,
                  },
                },
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'test:before:run',
              {
                id: 'r7',
                title: 'test 2',
                body: '[body]',
                type: 'test',
                wallClockStartedAt: match.date,
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'test:before:run:async',
              {
                id: 'r7',
                title: 'test 2',
                body: '[body]',
                type: 'test',
                wallClockStartedAt: match.date,
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'fail',
              {},
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r7',
                title: 'test 2',
                err: '{Object 3}',
                body: '[body]',
                type: 'test',
                duration: match.number,
                wallClockStartedAt: match.date,
                timings: {
                  lifecycle: match.number,
                  test: {
                    fnDuration: match.number,
                    afterFnDuration: match.number,
                  },
                },
                attemptIndex: 0,
                final: true,
              },
            ],
            [
              'test:after:run',
              {
                id: 'r7',
                title: 'test 2',
                err: '{Object 3}',
                state: 'failed',
                body: '[body]',
                type: 'test',
                duration: match.number,
                wallClockStartedAt: match.date,
                wallClockDuration: match.number,
                timings: {
                  lifecycle: match.number,
                  test: {
                    fnDuration: match.number,
                    afterFnDuration: match.number,
                  },
                },
                attemptIndex: 0,
                final: true,
              },
            ],
            ['run:end'],
          ])
        })
      })

      it('fail pass', function () {
        return createCypress({
          suites: {
            'suite 1': {
              tests: [
                {
                  name: 'test 1',
                  fail: true,
                },
                { name: 'test 2' },
              ],
            },
          },
        }).call('run')
        .then(shouldHaveFailed(1))
        .then(() => {
          expect(formatEvents(allStubs)).to.matchDeep([
            ['run:start'],
            ['test:before:run', { id: 'r3', title: 'test 1' }],
            ['test:before:run:async', { id: 'r3', title: 'test 1' }],
            ['fail', {}],
            [
              'runnable:after:run:async',
              { id: 'r3', title: 'test 1', err: '[Object]' },
            ],
            [
              'test:after:run',
              { id: 'r3', title: 'test 1', err: '[Object]', state: 'failed' },
            ],
            ['test:before:run', { id: 'r4', title: 'test 2' }],
            ['test:before:run:async', { id: 'r4', title: 'test 2' }],
            ['runnable:after:run:async', { id: 'r4', title: 'test 2' }],
            ['test:after:run', { id: 'r4', title: 'test 2', state: 'passed' }],
            ['run:end'],
          ])
        })
      })
      it('no tests', function () {
        return createCypress({}).call('run')
        .then(shouldHaveFailed(0))
        .then(() => {
          expect(formatEvents(allStubs)).to.matchDeep([['run:start'], ['run:end']])
        })
      })
      it.skip('simple fail, catch cy.on(fail)', function () {
        return createCypress({
          suites: {
            'suite 1': {
              tests: [
                {
                  name: 'test 1',
                  fn: () => {
                    console.log('test ran')
                    Cypress.on('fail', () => {
                      console.log('on:fail')

                      return false
                    })
                    console.log('added handler')
                    expect(false).ok
                    throw new Error('error in test')
                  },
                },
              ],
            },
          },
        }).call('run')
        .then(shouldHaveFailed(0))
        .then(() => {
          expect(formatEvents(allStubs)).to.matchDeep([
            ['run:start'],
            ['test:before:run', { id: 'r3', title: 'test 1' }],
            ['test:before:run:async', { id: 'r3', title: 'test 1' }],
            ['runnable:after:run:async', { id: 'r3', title: 'test 1' }],
            ['test:after:run', { id: 'r3', title: 'test 1', state: 'passed' }],
            ['run:end'],
          ])
        })
      })

      describe('hook failures', () => {
        it('fail in [before]', function () {
          return createCypress({
            suites: {
              'suite 1': {
                hooks: [
                  {
                    type: 'before',
                    fail: true,
                  },
                ],
                tests: [{ name: 'test 1' }],
              },
            },
          }).call('run')
          .then(shouldHaveFailed(1))
          .then(() => {
            expect(formatEvents(allStubs)).to.matchDeep([
              ['run:start'],
              ['test:before:run', { id: 'r3', title: 'test 1' }],
              ['test:before:run:async', { id: 'r3', title: 'test 1' }],
              ['fail', {}],
              [
                'runnable:after:run:async',
                {
                  id: 'r3',
                  title: '"before all" hook',
                  hookName: 'before all',
                  hookId: 'h1',
                  err: '[Object]',
                },
              ],
              [
                'test:after:run',
                {
                  id: 'r3',
                  title: 'test 1',
                  hookName: 'before all',
                  err: '[Object]',
                  state: 'failed',
                  failedFromHookId: 'h1',
                },
              ],
              ['run:end'],
            ])
          })
        })

        it('fail in [beforeEach]', function () {
          return createCypress({
            suites: {
              'suite 1': {
                hooks: [
                  {
                    type: 'beforeEach',
                    fail: true,
                  },
                ],
                tests: [{ name: 'test 1' }],
              },
            },
          }).call('run')
          .then(shouldHaveFailed(1))
          .then(() => {
            expect(formatEvents(allStubs)).to.matchDeep([
              ['run:start'],
              ['test:before:run', { id: 'r3', title: 'test 1' }],
              ['test:before:run:async', { id: 'r3', title: 'test 1' }],
              ['fail', {}],
              [
                'runnable:after:run:async',
                {
                  id: 'r3',
                  title: '"before each" hook',
                  hookName: 'before each',
                  hookId: 'h1',
                  err: '[Object]',
                },
              ],
              [
                'test:after:run',
                {
                  id: 'r3',
                  title: 'test 1',
                  hookName: 'before each',
                  err: '[Object]',
                  state: 'failed',
                  failedFromHookId: 'h1',
                },
              ],
              ['run:end'],
            ])
          })
        })

        it('fail in [afterEach]', function () {
          return createCypress({
            suites: {
              'suite 1': {
                hooks: [
                  {
                    type: 'afterEach',
                    fail: true,
                  },
                ],
                tests: [{ name: 'test 1' }],
              },
            },
          }).call('run')
          .then(shouldHaveFailed(1))
          .then(() => {
            expect(formatEvents(allStubs)).to.matchDeep([
              ['run:start'],
              ['test:before:run', { id: 'r3', title: 'test 1' }],
              ['test:before:run:async', { id: 'r3', title: 'test 1' }],
              ['runnable:after:run:async', { id: 'r3', title: 'test 1' }],
              ['fail', {}],
              [
                'runnable:after:run:async',
                {
                  id: 'r3',
                  title: '"after each" hook',
                  hookName: 'after each',
                  hookId: 'h1',
                  err: '[Object]',
                },
              ],
              [
                'test:after:run',
                {
                  id: 'r3',
                  title: 'test 1',
                  hookName: 'after each',
                  err: '[Object]',
                  state: 'failed',
                  failedFromHookId: 'h1',
                },
              ],
              ['run:end'],
            ])
          })
        })
        it('fail in [after]', function () {
          return createCypress({
            suites: {
              'suite 1': {
                hooks: [
                  {
                    type: 'after',
                    fail: true,
                  },
                ],
                tests: [{ name: 'test 1' }],
              },
            },
          }).call('run')
          .then(shouldHaveFailed(1))
          .then(() => {
            expect(formatEvents(allStubs)).to.matchDeep([
              ['run:start'],
              ['test:before:run', { id: 'r3', title: 'test 1' }],
              ['test:before:run:async', { id: 'r3', title: 'test 1' }],
              ['runnable:after:run:async', { id: 'r3', title: 'test 1' }],
              ['fail', {}],
              [
                'runnable:after:run:async',
                {
                  id: 'r3',
                  title: '"after all" hook',
                  hookName: 'after all',
                  hookId: 'h1',
                  err: '[Object]',
                },
              ],
              [
                'test:after:run',
                {
                  id: 'r3',
                  title: 'test 1',
                  hookName: 'after all',
                  err: '[Object]',
                  state: 'failed',
                  failedFromHookId: 'h1',
                },
              ],
              ['run:end'],
            ])
          })
        })

        it('fail in [after], skip remaining tests', function () {
          return createCypress({
            suites: {
              'suite 1': {
                hooks: [
                  {
                    type: 'after',
                    fail: true,
                  },
                ],
                tests: ['test 1', 'test 2'],
              },
            },
          }).call('run')
          .then(shouldHaveFailed(1))
          .then(() => {
            expect(formatEvents(allStubs)).to.matchDeep([
              ['run:start'],
              ['test:before:run', { id: 'r3', title: 'test 1' }],
              ['test:before:run:async', { id: 'r3', title: 'test 1' }],
              ['runnable:after:run:async', { id: 'r3', title: 'test 1' }],
              [
                'test:after:run',
                { id: 'r3', title: 'test 1', state: 'passed' },
              ],
              ['test:before:run', { id: 'r4', title: 'test 2' }],
              ['test:before:run:async', { id: 'r4', title: 'test 2' }],
              ['runnable:after:run:async', { id: 'r4', title: 'test 2' }],
              ['fail', {}],
              [
                'runnable:after:run:async',
                {
                  id: 'r4',
                  title: '"after all" hook',
                  hookName: 'after all',
                  hookId: 'h1',
                  err: '[Object]',
                },
              ],
              [
                'test:after:run',
                {
                  id: 'r4',
                  title: 'test 2',
                  hookName: 'after all',
                  err: '[Object]',
                  state: 'failed',
                  failedFromHookId: 'h1',
                },
              ],
              ['run:end'],
            ])
          })
        })
      })
      describe('test failures w/ hooks', () => {
        it('fail with [before]', function () {
          return createCypress({
            suites: {
              'suite 1': {
                hooks: ['before'],
                tests: [
                  {
                    name: 'test 1',
                    fail: true,
                  },
                  { name: 'test 2' },
                ],
              },
            },
          }).call('run')
          .then(shouldHaveFailed(1))
          .then(() => {
            expect(formatEvents(allStubs)).to.matchDeep([
              ['run:start'],
              ['test:before:run', { id: 'r3', title: 'test 1' }],
              ['test:before:run:async', { id: 'r3', title: 'test 1' }],
              [
                'runnable:after:run:async',
                {
                  id: 'r3',
                  title: '"before all" hook',
                  hookName: 'before all',
                  hookId: 'h1',
                },
              ],
              ['fail', {}],
              [
                'runnable:after:run:async',
                { id: 'r3', title: 'test 1', err: '[Object]' },
              ],
              [
                'test:after:run',
                { id: 'r3', title: 'test 1', err: '[Object]', state: 'failed' },
              ],
              ['test:before:run', { id: 'r4', title: 'test 2' }],
              ['test:before:run:async', { id: 'r4', title: 'test 2' }],
              ['runnable:after:run:async', { id: 'r4', title: 'test 2' }],
              [
                'test:after:run',
                { id: 'r4', title: 'test 2', state: 'passed' },
              ],
              ['run:end'],
            ])
          })
        })

        it('fail with [after]', function () {
          return createCypress({
            suites: {
              'suite 1': {
                hooks: [{ type: 'after' }],
                tests: [{ name: 'test 1', fail: true }, 'test 2'],
              },
            },
          }).call('run')
          .then(shouldHaveFailed(1))
          .then(() => {
            expect(formatEvents(allStubs)).to.matchDeep([
              ['run:start'],
              ['test:before:run', { id: 'r3', title: 'test 1' }],
              ['test:before:run:async', { id: 'r3', title: 'test 1' }],
              ['fail', {}],
              [
                'runnable:after:run:async',
                { id: 'r3', title: 'test 1', err: '[Object]' },
              ],
              [
                'test:after:run',
                { id: 'r3', title: 'test 1', err: '[Object]', state: 'failed' },
              ],
              ['test:before:run', { id: 'r4', title: 'test 2' }],
              ['test:before:run:async', { id: 'r4', title: 'test 2' }],
              ['runnable:after:run:async', { id: 'r4', title: 'test 2' }],
              [
                'runnable:after:run:async',
                {
                  id: 'r4',
                  title: '"after all" hook',
                  hookName: 'after all',
                  hookId: 'h1',
                },
              ],
              [
                'test:after:run',
                { id: 'r4', title: 'test 2', state: 'passed' },
              ],
              ['run:end'],
            ])
          })
        })

        it('fail with all hooks', function () {
          return createCypress({
            suites: {
              'suite 1': {
                hooks: ['before', 'beforeEach', 'afterEach', 'after'],
                tests: [{ name: 'test 1', fail: true }],
              },
            },
          }).call('run')
          .then(shouldHaveFailed(1))
          .then(() => {
            expect(formatEvents(allStubs)).to.matchDeep([
              ['run:start'],
              [
                'test:before:run',
                {
                  id: 'r3',
                  title: 'test 1',
                },
              ],
              [
                'test:before:run:async',
                {
                  id: 'r3',
                  title: 'test 1',
                },
              ],
              [
                'runnable:after:run:async',
                {
                  id: 'r3',
                  title: '"before all" hook',
                  hookName: 'before all',
                  hookId: 'h1',
                },
              ],
              [
                'runnable:after:run:async',
                {
                  id: 'r3',
                  title: '"before each" hook',
                  hookName: 'before each',
                  hookId: 'h2',
                },
              ],
              ['fail', {}],
              [
                'runnable:after:run:async',
                {
                  id: 'r3',
                  title: 'test 1',
                  err: '[Object]',
                },
              ],
              [
                'runnable:after:run:async',
                {
                  id: 'r3',
                  title: '"after each" hook',
                  hookName: 'after each',
                  hookId: 'h3',
                },
              ],
              [
                'runnable:after:run:async',
                {
                  id: 'r3',
                  title: '"after all" hook',
                  hookName: 'after all',
                  hookId: 'h4',
                },
              ],
              [
                'test:after:run',
                {
                  id: 'r3',
                  title: 'test 1',
                  err: '[Object]',
                  state: 'failed',
                },
              ],
              ['run:end'],
            ])
          })
        })
      })

      describe('mocha grep', () => {
        it.skip('fail with [only]', function () {
          return createCypress({
            suites: {
              'suite 1': {
                tests: [
                  { name: 'a test', fail: true },
                  { name: 'test 1', fail: true, only: true },
                  'test 2',
                ],
              },
            },
          }).call('run')
          .then(shouldHaveFailed(1))
          .then(() => {
            expect(formatEvents(allStubs)).to.matchDeep([
              ['run:start'],
              [
                'test:before:run',
                {
                  id: 'r3',
                  title: 'test 1',
                },
              ],
              [
                'test:before:run:async',
                {
                  id: 'r3',
                  title: 'test 1',
                },
              ],
              ['fail', {}],
              [
                'runnable:after:run:async',
                {
                  id: 'r3',
                  title: 'test 1',
                  err: '[Object]',
                },
              ],
              [
                'test:after:run',
                {
                  id: 'r3',
                  title: 'test 1',
                  err: '[Object]',
                  state: 'failed',
                },
              ],
              ['run:end'],
            ])
          })
        })
      })

      describe('retries', () => {
        it('simple retry', function () {
          return createCypress({
            suites: {
              'suite 1': {
                tests: [{ name: 'test 1', fail: 1 }],
              // tests: [{ name: 'test 1', fail: true }, 'test 2'],
              },
            },
          }, { retries: 1 }).call('run')
          .then(shouldHaveFailed(0))
          .then(() => {
            expect(formatEvents(allStubs)).to.matchDeep([
              ['run:start'],
              ['test:before:run', { id: 'r3', title: 'test 1' }],
              ['test:before:run:async', { id: 'r3', title: 'test 1' }],
              ['fail', {}],
              [
                'runnable:after:run:async',
                { id: 'r3', title: 'test 1', err: '[Object]' },
              ],
              [
                'test:after:run',
                { id: 'r3', title: 'test 1', err: '[Object]', state: 'failed' },
              ],
              ['test:before:run', { id: 'r3', title: 'test 1' }],
              ['test:before:run:async', { id: 'r3', title: 'test 1' }],
              ['runnable:after:run:async', { id: 'r3', title: 'test 1' }],
              [
                'test:after:run',
                { id: 'r3', title: 'test 1', state: 'passed' },
              ],
              ['run:end'],
            ])
          })
        })

        it('test retry with hooks', function () {
          return cy.then(() => {
            return createCypress({
              suites: {
                'suite 1': {
                  hooks: ['before', 'beforeEach', 'afterEach', 'after'],
                  tests: [
                    { name: 'test 1', fail: 1 },
                    // { name: 'test 1', fail: false },
                    // { name: 'test 1', fail: true }, 'test 1',
                    // 'test 1', 'test 2',
                  ],
                },
              },
            }).call('run')
            .then(shouldHaveFailed(0))
            .then(() => {

              expect(formatEvents(allStubs)).matchDeep([
                ['run:start'],
                [
                  'test:before:run',
                  {
                    'id': 'r3',
                    'title': 'test 1',
                    'attemptIndex': 0,
                  },
                ],
                [
                  'test:before:run:async',
                  {
                    'id': 'r3',
                    'title': 'test 1',
                    'attemptIndex': 0,
                  },
                ],
                [
                  'runnable:after:run:async',
                  {
                    'id': 'r3',
                    'title': '"before all" hook',
                    'hookName': 'before all',
                    'hookId': 'h1',
                  },
                ],
                [
                  'runnable:after:run:async',
                  {
                    'id': 'r3',
                    'title': '"before each" hook',
                    'hookName': 'before each',
                    'hookId': 'h2',
                  },
                ],
                [
                  'fail',
                  {},
                ],
                [
                  'runnable:after:run:async',
                  {
                    'id': 'r3',
                    'title': 'test 1',
                    'err': '[Object]',
                    'attemptIndex': 0,
                  },
                ],
                [
                  'runnable:after:run:async',
                  {
                    'id': 'r3',
                    'title': '"after each" hook',
                    'hookName': 'after each',
                    'hookId': 'h3',
                  },
                ],
                [
                  'test:after:run',
                  {
                    'id': 'r3',
                    'title': 'test 1',
                    'err': '[Object]',
                    'state': 'failed',
                    'attemptIndex': 0,
                  },
                ],
                [
                  'test:before:run',
                  {
                    'id': 'r3',
                    'title': 'test 1',
                    'attemptIndex': 1,
                    'final': true,
                  },
                ],
                [
                  'test:before:run:async',
                  {
                    'id': 'r3',
                    'title': 'test 1',
                    'attemptIndex': 1,
                    'final': true,
                  },
                ],
                [
                  'runnable:after:run:async',
                  {
                    'id': 'r3',
                    'title': '"before each" hook',
                    'hookName': 'before each',
                    'hookId': 'h2',
                  },
                ],
                [
                  'runnable:after:run:async',
                  {
                    'id': 'r3',
                    'title': 'test 1',
                    'attemptIndex': 1,
                    'final': true,
                  },
                ],
                [
                  'runnable:after:run:async',
                  {
                    'id': 'r3',
                    'title': '"after each" hook',
                    'hookName': 'after each',
                    'hookId': 'h3',
                  },
                ],
                [
                  'runnable:after:run:async',
                  {
                    'id': 'r3',
                    'title': '"after all" hook',
                    'hookName': 'after all',
                    'hookId': 'h4',
                  },
                ],
                [
                  'test:after:run',
                  {
                    'id': 'r3',
                    'title': 'test 1',
                    'state': 'passed',
                    'attemptIndex': 1,
                    'final': true,
                  },
                ],
                ['run:end'],
              ])
            })
          })

        })
        it('test retry with hooks 2', function () {
          return createCypress({
            suites: {
              'suite 1': {
                hooks: ['before', 'beforeEach', 'afterEach', 'after'],
                tests: [
                  { name: 'test 1',
                    fn: () => {

                      // cy.reload()
                      // expect(false).ok

                      // cy.then(() => {
                      //   expect(false).ok
                      // })
                      // cy.visit('/fixtures/generic.html').then(() => {
                      //   console.log('will fail')
                      //   throw new Error('failed test')
                      // })

                    },
                  },
                  // { name: 'test 1', fail: false },
                  // { name: 'test 1', fail: true }, 'test 1',
                  // 'test 1', 'test 2',
                ],
              },
            },
          }).call('run')
          // .then(shouldHaveFailed(0))
          .then(() => {

            expect(formatEvents(allStubs)).deep.eq([
              ['run:start'],
              [
                'test:before:run',
                {
                  'id': 'r3',
                  'title': 'test 1',
                  'attemptIndex': 0,
                },
              ],
              [
                'test:before:run:async',
                {
                  'id': 'r3',
                  'title': 'test 1',
                  'attemptIndex': 0,
                },
              ],
              [
                'runnable:after:run:async',
                {
                  'id': 'r3',
                  'title': '"before all" hook',
                  'hookName': 'before all',
                  'hookId': 'h1',
                },
              ],
              [
                'runnable:after:run:async',
                {
                  'id': 'r3',
                  'title': '"before each" hook',
                  'hookName': 'before each',
                  'hookId': 'h2',
                },
              ],
              [
                'fail',
                {},
              ],
              [
                'runnable:after:run:async',
                {
                  'id': 'r3',
                  'title': 'test 1',
                  'err': '[Object]',
                  'attemptIndex': 0,
                },
              ],
              [
                'runnable:after:run:async',
                {
                  'id': 'r3',
                  'title': '"after each" hook',
                  'hookName': 'after each',
                  'hookId': 'h3',
                },
              ],
              [
                'test:after:run',
                {
                  'id': 'r3',
                  'title': 'test 1',
                  'err': '[Object]',
                  'state': 'failed',
                  'attemptIndex': 0,
                },
              ],
              [
                'test:before:run',
                {
                  'id': 'r3',
                  'title': 'test 1',
                  'attemptIndex': 1,
                  'final': true,
                },
              ],
              [
                'test:before:run:async',
                {
                  'id': 'r3',
                  'title': 'test 1',
                  'attemptIndex': 1,
                  'final': true,
                },
              ],
              [
                'runnable:after:run:async',
                {
                  'id': 'r3',
                  'title': '"before each" hook',
                  'hookName': 'before each',
                  'hookId': 'h2',
                },
              ],
              [
                'runnable:after:run:async',
                {
                  'id': 'r3',
                  'title': 'test 1',
                  'attemptIndex': 1,
                  'final': true,
                },
              ],
              [
                'runnable:after:run:async',
                {
                  'id': 'r3',
                  'title': '"after each" hook',
                  'hookName': 'after each',
                  'hookId': 'h3',
                },
              ],
              [
                'runnable:after:run:async',
                {
                  'id': 'r3',
                  'title': '"after all" hook',
                  'hookName': 'after all',
                  'hookId': 'h4',
                },
              ],
              [
                'test:after:run',
                {
                  'id': 'r3',
                  'title': 'test 1',
                  'state': 'passed',
                  'attemptIndex': 1,
                  'final': true,
                },
              ],
              ['run:end'],
            ])
          })
        })

      })

      it('test retry with many hooks', function () {
        return createCypress({
          suites: {
            'suite 1': {
              hooks: [
                'before',
                'beforeEach',
                'afterEach',
                'after',
                'before',
                'beforeEach',
                'afterEach',
                'after',
                'before',
                'beforeEach',
                'afterEach',
                'after',
              ],
              tests: [
                { name: 'test 1', fail: 1 },
                // { name: 'test 1', fail: false },
                // { name: 'test 1', fail: true }, 'test 1',
                // 'test 1', 'test 2',
              ],
            },
          },
        })
        .call('run')
        // .then(shouldHaveFailed(0))
        .then(() => {
          expect(formatEvents(allStubs)).to.deep.eq([
            ['run:start'],
            [
              'test:before:run',
              {
                id: 'r3',
                title: 'test 1',
                attemptIndex: 0,
              },
            ],
            [
              'test:before:run:async',
              {
                id: 'r3',
                title: 'test 1',
                attemptIndex: 0,
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"before all" hook',
                hookName: 'before all',
                hookId: 'h1',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"before all" hook',
                hookName: 'before all',
                hookId: 'h2',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"before all" hook',
                hookName: 'before all',
                hookId: 'h3',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"before each" hook',
                hookName: 'before each',
                hookId: 'h4',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"before each" hook',
                hookName: 'before each',
                hookId: 'h5',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"before each" hook',
                hookName: 'before each',
                hookId: 'h6',
              },
            ],
            ['fail', {}],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: 'test 1',
                err: '[Object]',
                attemptIndex: 0,
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"after each" hook',
                hookName: 'after each',
                hookId: 'h7',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"after each" hook',
                hookName: 'after each',
                hookId: 'h8',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"after each" hook',
                hookName: 'after each',
                hookId: 'h9',
              },
            ],
            [
              'test:after:run',
              {
                id: 'r3',
                title: 'test 1',
                err: '[Object]',
                state: 'failed',
                attemptIndex: 0,
              },
            ],
            [
              'test:before:run',
              {
                id: 'r3',
                title: 'test 1',
                attemptIndex: 1,
                final: true,
              },
            ],
            [
              'test:before:run:async',
              {
                id: 'r3',
                title: 'test 1',
                attemptIndex: 1,
                final: true,
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"before each" hook',
                hookName: 'before each',
                hookId: 'h4',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"before each" hook',
                hookName: 'before each',
                hookId: 'h5',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"before each" hook',
                hookName: 'before each',
                hookId: 'h6',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: 'test 1',
                attemptIndex: 1,
                final: true,
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"after each" hook',
                hookName: 'after each',
                hookId: 'h7',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"after each" hook',
                hookName: 'after each',
                hookId: 'h8',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"after each" hook',
                hookName: 'after each',
                hookId: 'h9',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"after all" hook',
                hookName: 'after all',
                hookId: 'h10',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"after all" hook',
                hookName: 'after all',
                hookId: 'h11',
              },
            ],
            [
              'runnable:after:run:async',
              {
                id: 'r3',
                title: '"after all" hook',
                hookName: 'after all',
                hookId: 'h12',
              },
            ],
            [
              'test:after:run',
              {
                id: 'r3',
                title: 'test 1',
                state: 'passed',
                attemptIndex: 1,
                final: true,
              },
            ],
            ['run:end'],
          ])
        })

      })

      it('retries from [beforeEach]', function () {
        return (
          createCypress({
            suites: {
              'suite 1': {
                hooks: [
                  'before',
                  'beforeEach',
                  { type: 'beforeEach', fail: 1 },
                  'beforeEach',
                  'afterEach',
                  'after',
                ],
                tests: [
                  { name: 'test 1', fail: 1 },
                  // { name: 'test 1', fail: false },
                  // { name: 'test 1', fail: true }, 'test 1',
                  // 'test 1', 'test 2',
                ],
              },
            },
          })
          // .then(shouldHaveFailed(0))
          .then(() => {
            expect(formatEvents(allStubs)).to.matchDeep([
              ['run:start'],
              [
                'test:before:run',
                {
                  id: 'r3',
                  title: 'test 1',
                  body: '[body]',
                  type: 'test',
                  wallClockStartedAt: match.date,
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'test:before:run:async',
                {
                  id: 'r3',
                  title: 'test 1',
                  body: '[body]',
                  type: 'test',
                  wallClockStartedAt: match.date,
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'runnable:after:run:async',
                {
                  id: 'r3',
                  title: 'test 1',
                  body: '[body]',
                  type: 'test',
                  duration: match.number,
                  wallClockStartedAt: match.date,
                  timings: {
                    lifecycle: match.number,
                    test: {
                      fnDuration: match.number,
                      afterFnDuration: match.number,
                    },
                  },
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'test:after:run',
                {
                  id: 'r3',
                  title: 'test 1',
                  state: 'passed',
                  body: '[body]',
                  type: 'test',
                  duration: match.number,
                  wallClockStartedAt: match.date,
                  wallClockDuration: 128,
                  timings: {
                    lifecycle: match.number,
                    test: {
                      fnDuration: match.number,
                      afterFnDuration: match.number,
                    },
                  },
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'test:before:run',
                {
                  id: 'r4',
                  title: 'test 2',
                  body: '[body]',
                  type: 'test',
                  wallClockStartedAt: match.date,
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'test:before:run:async',
                {
                  id: 'r4',
                  title: 'test 2',
                  body: '[body]',
                  type: 'test',
                  wallClockStartedAt: match.date,
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'fail',
                {},
              ],
              [
                'runnable:after:run:async',
                {
                  id: 'r4',
                  title: 'test 2',
                  err: '{Object 3}',
                  body: '[body]',
                  type: 'test',
                  duration: match.number,
                  wallClockStartedAt: match.date,
                  timings: {
                    lifecycle: match.number,
                    test: {
                      fnDuration: match.number,
                      afterFnDuration: match.number,
                    },
                  },
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'test:after:run',
                {
                  id: 'r4',
                  title: 'test 2',
                  err: '{Object 3}',
                  state: 'failed',
                  body: '[body]',
                  type: 'test',
                  duration: match.number,
                  wallClockStartedAt: match.date,
                  wallClockDuration: 171,
                  timings: {
                    lifecycle: match.number,
                    test: {
                      fnDuration: match.number,
                      afterFnDuration: match.number,
                    },
                  },
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'test:before:run',
                {
                  id: 'r6',
                  title: 'test 1',
                  body: '[body]',
                  type: 'test',
                  wallClockStartedAt: match.date,
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'test:before:run:async',
                {
                  id: 'r6',
                  title: 'test 1',
                  body: '[body]',
                  type: 'test',
                  wallClockStartedAt: match.date,
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'runnable:after:run:async',
                {
                  id: 'r6',
                  title: 'test 1',
                  body: '[body]',
                  type: 'test',
                  duration: match.number,
                  wallClockStartedAt: match.date,
                  timings: {
                    lifecycle: match.number,
                    test: {
                      fnDuration: match.number,
                      afterFnDuration: match.number,
                    },
                  },
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'test:after:run',
                {
                  id: 'r6',
                  title: 'test 1',
                  state: 'passed',
                  body: '[body]',
                  type: 'test',
                  duration: match.number,
                  wallClockStartedAt: match.date,
                  wallClockDuration: 109,
                  timings: {
                    lifecycle: match.number,
                    test: {
                      fnDuration: match.number,
                      afterFnDuration: match.number,
                    },
                  },
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'test:before:run',
                {
                  id: 'r7',
                  title: 'test 2',
                  body: '[body]',
                  type: 'test',
                  wallClockStartedAt: match.date,
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'test:before:run:async',
                {
                  id: 'r7',
                  title: 'test 2',
                  body: '[body]',
                  type: 'test',
                  wallClockStartedAt: match.date,
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'fail',
                {},
              ],
              [
                'runnable:after:run:async',
                {
                  id: 'r7',
                  title: 'test 2',
                  err: '{Object 3}',
                  body: '[body]',
                  type: 'test',
                  duration: match.number,
                  wallClockStartedAt: match.date,
                  timings: {
                    lifecycle: match.number,
                    test: {
                      fnDuration: match.number,
                      afterFnDuration: match.number,
                    },
                  },
                  attemptIndex: 0,
                  final: true,
                },
              ],
              [
                'test:after:run',
                {
                  id: 'r7',
                  title: 'test 2',
                  err: '{Object 3}',
                  state: 'failed',
                  body: '[body]',
                  type: 'test',
                  duration: match.number,
                  wallClockStartedAt: match.date,
                  wallClockDuration: 138,
                  timings: {
                    lifecycle: match.number,
                    test: {
                      fnDuration: match.number,
                      afterFnDuration: match.number,
                    },
                  },
                  attemptIndex: 0,
                  final: true,
                },
              ],
              ['run:end'],
            ])
          })
        )
      })
    })
    describe('save/reload state', () => {
      // _.times(40, () =>
      it('state simple 1', async () => {

        const test2_deferred = defer()
        const test1 = promiseStub('test1')
        const test2 = promiseStub('test2', () => test2_deferred.promise)

        const mochaTests = {
          suites: { 'suite 1': { tests: [
            { name: 'test 1', fn: test1.stub },
            { name: 'test 2',
              fn: test2.stub,
            },
            { name: 'test 3' },
          ] } },
        }

        const Cy1 = await createCypress(mochaTests)

        Cy1.run()
        await test2.onCall(0)

        const s1 = getRunState(Cy1)

        const Cy2 = await createCypress(mochaTests, {
          state: s1,
        })

        Cy2.run()
        await test2.onCall(1)

        const s2 = getRunState(Cy2)

        expect(test1.stub).calledOnce
        expect(s2).to.deep.eq(s1)

        // we don't really have to finish the runs here...
        // test2_deferred.resolve()
      })
      // )

      it('retries simple 1', async () => {

        const test2_deferred = defer()
        const test1 = promiseStub('test1', () => {
          if (test1.stub.callCount === 1) {
            throw new Error('fail')
          }
        })
        const test2 = promiseStub('test2', () => {
          if (test2.stub.callCount === 1) {
            throw new Error('test fail on first run')
          }

          return test2_deferred.promise
        })

        const mochaTests = {
          suites: { 'suite 1': { tests: [
            { name: 'test 1', fn: test1.stub },
            { name: 'test 2',
              fn: test2.stub,
            },
            { name: 'test 3' },
          ] } },
        }

        const Cy1 = await createCypress(mochaTests)

        Cy1.env('RETRIES', 1)

        Cy1.run()
        await test2.onCall(1)
        cyLog('run 2')

        const s1 = getRunState(Cy1)

        const Cy2 = await createCypress(mochaTests, {
          state: s1,
        })

        Cy2.run()
        await test2.onCall(2)

        const s2 = getRunState(Cy2)

        // expect(test1.stub).calledOnce
        expect(test2.stub).calledThrice
        expect(s2).to.deep.eq(s1)

        test2_deferred.resolve()
      })
    })
  })

  describe.skip('simple reload', () => {
    it('pass this one', () => {
      cy.visit('/fixtures/dom.html')
    })

    it('simple reload', () => {
      expect(true).ok
      const s1 = getRunState(Cypress)

      cy.task('state', ['runState', s1])

      // console.log(s1)

      // // cy.visit('/fixtures/dom.html')
      // // cy.visit('/fixtures/generic.html')
      cy.visit('www.example.com')

      cy.then(() => {

        let s

        cy.task('state', ['runState']).then((_s) => {

          s = _s

          const s2 = getRunState(Cypress)

          expect(s2).to.matchDeep(s)

          console.log(s2)
        })

      })

    })
  })
})

const getTestFromRunnable = (runnable) => {
  return runnable.ctx.currentTest || runnable
}

const getRunState = (Cypress) => {

  // cypress normally accesses `id` via a closure
  const currentRunnable = Cypress.cy.state('runnable')
  // const currentTest = currentRunnable && getTestFromRunnable(currentRunnable)
  // const currentId = currentTest && currentTest.id

  const currentId = currentRunnable && currentRunnable.id

  const s = {
    currentId,
    tests: Cypress.getTestsState(),
    startTime: Cypress.getStartTime(),
    emissions: Cypress.getEmissions(),
  }

  s.passed = Cypress.countByTestState(s.tests, 'passed')
  s.failed = Cypress.countByTestState(s.tests, 'failed')
  s.pending = Cypress.countByTestState(s.tests, 'pending')
  s.numLogs = Cypress.Log.countLogsByTests(s.tests)

  return s
}

const normalizeSpecs = {
  wallClockStartedAt: match.date,
  wallClockDuration: match.number,
  fnDuration: match.number,
  afterFnDuration: match.number,
  lifecycle: match.number,
  'body': '[test body]',
  'duration': match.number,
}

const createCypress = (mochaTests, opts) => {

  window._cypress_instances = (window._cypress_instances || 0) + 1
  const instanceNumber = window._cypress_instances

  opts = _.defaults(opts, {
    stubs: true,
    state: undefined,
    retries: 0,
  })

  const newIframe = cy.$$('<iframe src="/fixtures/dom.html" style="width:200px;height:200px" >').appendTo(cy.$$('body'))[0]

  const newWindow = newIframe.contentWindow

  return new Cypress.Promise($(newWindow.document).ready)
  .delay(100)
  .then(() => {

    const newCypress = Cypress.$Cypress.create(Cypress.config())

    newCypress.onSpecWindow(newWindow)
    newCypress.initialize($(newIframe))

    helpers.generateMochaTestsForWin(newWindow, mochaTests)

    newCypress.env('RETRIES', opts.retries)

    if (opts.state) {
      const state = _.cloneDeep(opts.state)

      newCypress.normalizeAll(state.tests)
      newCypress.setNumLogs(state.numLogs)
      newCypress.setStartTime(state.startTime)
      newCypress.resumeAtTest(state.currentId, state.emissions)
    } else {
      newCypress.normalizeAll()
    }

    if (opts.stubs) {
      allStubs = cy.stub()

      const emit = newCypress.emit
      const emitMap = newCypress.emitMap
      const emitThen = newCypress.emitThen

      cy.stub(newCypress, 'emit').log(false)
      .callsFake(function () {

        const noLog = _.includes([
          'navigation:changed',
          'stability:changed',
          'window:load',
          'url:changed',
          'log:added',
          'page:loading',
        ], arguments[0])
        const noCall = _.includes(['test:before:run'], arguments[0])

        noLog || allStubs.apply(this, [].slice.call(arguments, 0))

        return noCall || emit.apply(this, arguments)
      })
      cy.stub(newCypress, 'emitMap').log(false)
      .callsFake(function () {
        allStubs.apply(this, arguments)

        return emitMap.apply(this, arguments)
      })
      cy.stub(newCypress, 'emitThen').log(false)
      .callsFake(function () {
        allStubs.apply(this, arguments)

        if (_.includes(['test:before:run:async'], arguments[0])) {
          return Promise.resolve(true)
        }

        return emitThen.apply(this, arguments)
      })
    } else {
      cy.stub(newCypress, 'emit').log(false)
      cy.stub(newCypress, 'emitMap').log(false)
      cy.stub(newCypress, 'emitThen').log(false)
    }

    const _run = newCypress.run.bind(newCypress)

    // cy.spy(newCypress.utils, 'throwErr')

    const _fail = newCypress.mocha.getRunner().fail

    newCypress.mocha.getRunner().fail = function () {

      Cypress.log({
        name: `Runner ${instanceNumber} Fail`,
        message: `| ${arguments[1]}`,
        state: 'failed',
      })

      const ret = _fail.apply(this, arguments)

      return ret

    }

    newCypress.run = () => new Cypress.Promise((res) => _run(res))
    // .tap(() => {
    //   debugger
    // })

    console.log(newCypress)

    window.cy = backupCy
    window.Cypress = backupCypress

    return newCypress
  })

}

const cleanse = (obj = {}, keys) => {
  return _.mapValues(obj, (value, key) => {
    if (keys[key] !== undefined) {
      return keys[key]
    }

    if (_.includes(keys, key)) {
      return `[${Object.prototype.toString.call(value).split(' ')[1]}`
    }

    return value
  })
}

// const mapEvents = (stub) => {
//   return _.flatMap(stub.args)
// }

const formatEvents = (stub) => {
  return _.flatMap(stub.args, (args) => {
    if (args[0] === 'mocha') {
      return []
    }

    // if (_.isObject(args[1])) {
    //   args[1] = _.omit(_.toPlainObject(args[1]), [
    //     'body',
    //     'timings',
    //     'type',
    //     'wallClockStartedAt',
    //     'duration',
    //     'wallClockDuration',
    //   ])
    //   args[1] = cleanse(args[1], ['err'])
    // }

    let ret = [args[0]]

    if (args[1] != null) {
      ret = ret.concat([args[1]])
    }

    return [ret]
  })
}

const stringifyShort = (obj) => {
  if (_.isArray(obj)) {
    return `[Array ${obj.length}]`
  }

  if (_.isObject(obj)) {
    return `{Object ${Object.keys(obj).length}}`
  }

  return obj
}

const shouldHaveFailed = (exp) => {
  return (act) => {
    expect(act).to.eq(exp, 'to have failed tests')
  }
}

const _getReplacementFor = (path, opts) => {
  let found

  _.each(opts, (val) => {
    const matched = (_.last(path) === _.last(val[0])) && _.isEqual(_.intersection(path, val[0]), val[0])

    if (matched) {
      found = val[1]
    }
  })

  return found
}

const mapKeys = (obj, keymap) => {

  obj = _.cloneDeep(obj)

  const replacePaths = _.map(keymap, (val, key) => {
    return [key.split('.'), val]
  })

  const objset = new Set()

  const recurse = (obj, path = []) => {

    _.each(obj, (v, k) => {
      const newPath = path.concat([k])

      if (objset.has(v)) {
        return
      }

      objset.add(v)

      if (path.length > 15) {
        console.log(`too deep: ${path}`)

        return
      }

      const replace = _getReplacementFor(newPath, replacePaths)

      if (replace !== undefined) {
        delete obj[k]
        obj[replace] = v
        newPath.slice(0, -1).push(replace)
      }

      if (_.isObjectLike(v)) {
        recurse(v, newPath)
      }

    })

    return obj
  }

  return recurse(obj, ['^'])
}

// const expect = (act, exp, message) =).to.matchDeep( {
//   const res = isMatch(exp, act)

//   if (!res.match) {
//     // eslint-disable-next-line
//     console.log(exp, act);
//     // console.log(jestDiff(exp, act))
//     if (_.isObject(act)) {
//       lastActual = act
//       const diffString = getDiffString(exp, act)

//       assert(false, `expected object ${res.message}: ${diffString}`)
//     }

//     assert(false, `expected ${res.message}, but was ${act}`)
//   }

//   assert(true, `expected ${message || 'var'} to ${res.message}`)
// }

function copyToClipboard (text) {
  let el = document.createElement('textarea')

  document.body.appendChild(el)
  el.value = text
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)

  // let el = document.createElement('div')

  // document.body.appendChild(el)
  // el.innerText = text
  // // el.select()
  // const range = document.createRange()

  // range.selectNodeContents(el)
  // const sel = document.getSelection()

  // sel.removeAllRanges()
  // sel.addRange(range)
  // document.execCommand('copy')
  // document.body.removeChild(el)
}

const cyLog = (...args) => Cypress.log({
  name: 'log',
  message: args.join(' '),
  state: 'passed',
})

const promiseStub = (str, fn) => {
  let callCount = 0
  const deferreds = {}

  const stub = cy.stub()
  .callsFake(() => {
    if (deferreds[callCount]) {
      deferreds[callCount].resolve()
    }

    callCount++

    return fn && fn()
  }).as(str || 'promiseStub')

  return {
    stub,
    onCall (n) {
      return Cypress.Promise.try(() => {
        if (callCount > n) {
          return stub.getCall(n)
        }

        const deferred = defer()

        deferreds[n] = deferred

        return deferred.promise
        .then(() => {

          return stub.getCall(n)
        })

      })
    },
  }
}
