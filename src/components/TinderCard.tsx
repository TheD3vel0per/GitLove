/* global WebKitCSSMatrix */

const React = require('react')
const sleep = require('p-sleep')

const settings = {
  snapBackDuration: 300,
  maxTilt: 5,
  bouncePower: 0.2,
  swipeThreshold: 300 // px/s
}

const getElementSize = (element) => {
  const elementStyles = window.getComputedStyle(element)
  const widthString = elementStyles.getPropertyValue('width')
  const width = Number(widthString.split('px')[0])
  const heightString = elementStyles.getPropertyValue('height')
  const height = Number(heightString.split('px')[0])
  return { x: width, y: height }
}

const pythagoras = (x, y) => {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
}

const animateOut = async (element, speed) => {
  const startPos = getTranslate(element)
  const bodySize = getElementSize(document.body)
  const diagonal = pythagoras(bodySize.x, bodySize.y)

  const velocity = pythagoras(speed.x, speed.y)
  const time = diagonal / velocity
  const multiplier = diagonal / velocity

  const translateString = translationString(speed.x * multiplier + startPos.x, -speed.y * multiplier + startPos.y)
  const rotateString = rotationString(getRotation(element))

  element.style.transition = 'ease-out ' + time + 's'
  element.style.transform = translateString + rotateString

  await sleep(time * 1000)
}

const animateBack = (element) => {
  element.style.transition = settings.snapBackDuration + 'ms'
  const startingPoint = getTranslate(element)
  const translation = translationString(startingPoint.x * -settings.bouncePower, startingPoint.y * -settings.bouncePower)
  const rotation = rotationString(getRotation(element) * -settings.bouncePower)
  element.style.transform = translation + rotation

  setTimeout(() => {
    element.style.transform = 'none'
  }, settings.snapBackDuration * 0.75)

  setTimeout(() => {
    element.style.transition = '10ms'
  }, settings.snapBackDuration)
}

const getSwipeDirection = (speed) => {
  if (Math.abs(speed.x) > Math.abs(speed.y)) {
    return (speed.x > 0) ? 'right' : 'left'
  } else {
    return (speed.y > 0) ? 'up' : 'down'
  }
}

const calcSpeed = (oldLocation, newLocation) => {
  const dx = newLocation.x - oldLocation.x
  const dy = oldLocation.y - newLocation.y
  const dt = (newLocation.time - oldLocation.time) / 1000
  return { x: dx / dt, y: dy / dt }
}

const translationString = (x, y) => {
  const translation = 'translate(' + x + 'px, ' + y + 'px)'
  return translation
}

const rotationString = (rot) => {
  const rotation = 'rotate(' + rot + 'deg)'
  return rotation
}

const getTranslate = (element) => {
  const style = window.getComputedStyle(element)
  const matrix = new WebKitCSSMatrix(style.webkitTransform)
  const ans = { x: matrix.m41, y: matrix.m42 }
  return ans
}

const getRotation = (element) => {
  const style = window.getComputedStyle(element)
  const matrix = new WebKitCSSMatrix(style.webkitTransform)
  const ans = -Math.asin(matrix.m21) / (2 * Math.PI) * 360
  return ans
}

const dragableTouchmove = (coordinates, element, offset, lastLocation) => {
  const pos = { x: coordinates.x + offset.x, y: coordinates.y + offset.y }
  const newLocation = { x: pos.x, y: pos.y, time: new Date().getTime() }
  const translation = translationString(pos.x, pos.y)
  const rotCalc = calcSpeed(lastLocation, newLocation).x / 1000
  const rotation = rotationString(rotCalc * settings.maxTilt)
  element.style.transform = translation + rotation
  return newLocation
}

const touchCoordinatesFromEvent = (e) => {
  const touchLocation = e.targetTouches[0]
  return { x: touchLocation.clientX, y: touchLocation.clientY }
}

const mouseCoordinatesFromEvent = (e) => {
  return { x: e.clientX, y: e.clientY }
}

let swipeAlreadyReleased = false

const TinderCard: React.FC<any> = ({ flickOnSwipe = true, children, onSwipe, onCardLeftScreen, onLeftSideClick, onRightSideClick, className, preventSwipe = [] }) => {
  const handleSwipeReleased = async (element, speed, offset) => {
    if (swipeAlreadyReleased) { return }
    swipeAlreadyReleased = true
    if (Math.abs(speed.x) > settings.swipeThreshold || Math.abs(speed.y) > settings.swipeThreshold) { // Swipe recognized
      onSwipe(getSwipeDirection(speed))
      if (flickOnSwipe) {
        if (preventSwipe.includes(getSwipeDirection(speed))) {
          animateBack(element)
        } else {
          await animateOut(element, speed)
          element.style.display = 'none'
          onCardLeftScreen()
        }
      } else {
        animateBack(element)
      }
    } else {
      animateBack(element)
      if (speed.x === 0 && speed.y === 0)
        handleClick(element, offset)
    }
  }

  const handleSwipeStart = () => {
    swipeAlreadyReleased = false
  }

  const handleClick = (element, offset) => {
    const bodySize = getElementSize(element);
    console.log(bodySize, offset)
    if(-offset.x < window.innerWidth/2) {
      // left side
      if (onLeftSideClick) onLeftSideClick()
    } else {
      // right side
      if (onRightSideClick) onRightSideClick()
    }
  }

  const ref = React.useCallback((element) => {
    if (!element) { return } // necesarry?
    let offset = { x: null, y: null }
    let speed = { x: 0, y: 0 }
    let lastLocation = { x: 0, y: 0, time: new Date().getTime() }
    let mouseIsClicked = false
    let isTouching = false

    element.addEventListener(('touchstart'), (ev) => {
      ev.preventDefault()
      speed = { x: 0, y: 0 }
      isTouching = true;
      handleSwipeStart()
      offset = { x: -touchCoordinatesFromEvent(ev).x, y: -touchCoordinatesFromEvent(ev).y }
    })

    element.addEventListener(('mousedown'), (ev) => {
      ev.preventDefault()
      speed = { x: 0, y: 0 }
      mouseIsClicked = true
      handleSwipeStart()
      offset = { x: -mouseCoordinatesFromEvent(ev).x, y: -mouseCoordinatesFromEvent(ev).y }
    })

    element.addEventListener(('touchmove'), (ev) => {
      ev.preventDefault()
      const newLocation = dragableTouchmove(touchCoordinatesFromEvent(ev), element, offset, lastLocation)
      speed = calcSpeed(lastLocation, newLocation)
      lastLocation = newLocation
    })

    element.addEventListener(('mousemove'), (ev) => {
      ev.preventDefault()
      if (mouseIsClicked) {
        const newLocation = dragableTouchmove(mouseCoordinatesFromEvent(ev), element, offset, lastLocation)
        speed = calcSpeed(lastLocation, newLocation)
        lastLocation = newLocation
      }
    })

    element.addEventListener(('touchend'), (ev) => {
      ev.preventDefault()
      isTouching = false
      handleSwipeReleased(element, speed, offset)
    })

    element.addEventListener(('mouseup'), (ev) => {
      if (mouseIsClicked) {
        ev.preventDefault()
        mouseIsClicked = false
        handleSwipeReleased(element, speed, offset)
      }
    })

    element.addEventListener(('mouseleave'), (ev) => {
      if (mouseIsClicked) {
        ev.preventDefault()
        mouseIsClicked = false
        handleSwipeReleased(element, speed, offset)
      }
    })
  })

  return (
    React.createElement('div', { ref, className }, children)
  )
}

export default TinderCard;