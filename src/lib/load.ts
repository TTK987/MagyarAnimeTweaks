export default function onLoad(fn: Function) {
    let isCalled = false

    const callOnce = () => {
        if (isCalled) return
        isCalled = true
        fn()
    }

    document.addEventListener('DOMContentLoaded', callOnce, { once: true })

    window.addEventListener('load', callOnce, { once: true })

    window.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
            callOnce()
        }
    })

    if (document.readyState === 'complete') {
        callOnce()
    }
}
