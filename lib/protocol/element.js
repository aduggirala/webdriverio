/**
 * Search for an element on the page, starting from the document root.
 * The located element will be returned as a WebElement JSON object.
 * The table below lists the locator strategies that each server should support.
 * Each locator must return the first matching element located in the DOM.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#find-element
 *
 * @param {String} selector selector to query the element
 * @returns {String} A WebElement JSON object for the located element.
 *
 * @type protocol
 *
 */

import findStrategy from '../helpers/findElementStrategy'
import hasElementResult from '../helpers/hasElementResultHelper'
import q from 'q'

let element = function (selector) {
    let requestPath = '/session/:sessionId/element'
    let lastPromise = this.lastResult ? q(this.lastResult).inspect() : this.lastPromise.inspect()
    let relative = false

    if (lastPromise.state === 'fulfilled' && hasElementResult(lastPromise.value) === 1) {
        if (!selector) {
            return lastPromise.value
        }

        /**
         * format xpath selector (global -> relative)
         */
        if (selector.slice(0, 2) === '//') {
            selector = '.' + selector.slice(1)
        }

        let elem = lastPromise.value.value.ELEMENT
        relative = true
        requestPath = `/session/:sessionId/element/${elem}/element`
    }

    let found = findStrategy(selector, relative)
    return this.requestHandler.create(
        requestPath,
        { using: found.using, value: found.value }
    ).then((result) => {
        result.selector = selector
        return result
    }, (e) => {
        let result = e.seleniumStack

        /**
         * if error is not NoSuchElement throw it
         */
        if (!result || result.type !== 'NoSuchElement') {
            throw e
        }

        result.state = 'failure'
        result.sessionId = this.requestHandler.sessionID
        result.value = null
        result.selector = selector
        delete result.orgStatusMessage
        return result
    })
}

export default element
