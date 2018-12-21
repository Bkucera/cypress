const $elements = require('./elements')

//nodes utils
function getOwnFirstVisibleTextNode (el) {
  const children = el.childNodes
  const childrenLength = $elements.getChildNodesLength(children)

  if (!childrenLength && isVisibleTextNode(el)) {
    return el
  }

  return arrayUtils.find(children, (node) => {
    return isVisibleTextNode(node)
  })
}

function getOwnFirstVisibleNode (el) {
  return arrayUtils.find(el.childNodes, (node) => {
    return isVisibleTextNode(node) ||
        !isSkippableNode(node) && getOwnFirstVisibleNode(node)
  })
}

function getOwnPreviousVisibleSibling (el) {
  let sibling = null
  let current = el

  while (!sibling) {
    current = current.previousSibling
    if (!current) {
      break
    } else if (!isSkippableNode(current) && !isInvisibleTextNode(current)) {
      sibling = current
      break
    }
  }

  return sibling
}

function isVisibleNode (node) {
  return $elements.isTextNode(node) || $elements.isElementNode(node) && styleUtils.isElementVisible(node)
}

function getVisibleChildren (node) {
  return arrayUtils.filter(node.childNodes, isVisibleNode)
}

function hasVisibleChildren (node) {
  return arrayUtils.some(node.childNodes, isVisibleNode)
}

function hasSelectableChildren (node) {
  return arrayUtils.some(node.childNodes, (child) => {
    return isNodeSelectable(child, true)
  })
}

//NOTE: before such elements (like div or p) adds line breaks before and after it
// (except line break before first visible element in contentEditable parent)
// this line breaks is not contained in node values
//so we should take it into account manually
function isNodeBlockWithBreakLine (parent, node) {
  let parentFirstVisibleChild = null
  let firstVisibleChild = null

  if ($elements.isShadowUIElement(parent) || $elements.isShadowUIElement(node)) {
    return false
  }

  if (!$elements.isTheSameNode(node, parent) && $elements.getChildNodesLength(node.childNodes) &&
        /div|p/.test($elements.getTagName(node))) {
    parentFirstVisibleChild = getOwnFirstVisibleNode(parent)

    if (!parentFirstVisibleChild || $elements.isTheSameNode(node, parentFirstVisibleChild)) {
      return false
    }

    firstVisibleChild = getFirstVisibleTextNode(parentFirstVisibleChild)
    if (!firstVisibleChild || $elements.isTheSameNode(node, firstVisibleChild)) {
      return false
    }

    return getOwnFirstVisibleTextNode(node)
  }

  return false
}

function isNodeAfterNodeBlockWithBreakLine (parent, node) {
  const isRenderedNode = $elements.isRenderedNode(node)
  let parentFirstVisibleChild = null
  let firstVisibleChild = null
  let previousSibling = null

  if ($elements.isShadowUIElement(parent) || $elements.isShadowUIElement(node)) {
    return false
  }

  if (!$elements.isTheSameNode(node, parent) &&
        (isRenderedNode && $elements.isElementNode(node) && $elements.getChildNodesLength(node.childNodes) &&
         !/div|p/.test($elements.getTagName(node)) ||
         isVisibleTextNode(node) && !$elements.isTheSameNode(node, parent) && node.nodeValue.length)) {

    if (isRenderedNode && $elements.isElementNode(node)) {
      parentFirstVisibleChild = getOwnFirstVisibleNode(parent)

      if (!parentFirstVisibleChild || $elements.isTheSameNode(node, parentFirstVisibleChild)) {
        return false
      }

      firstVisibleChild = getFirstVisibleTextNode(parentFirstVisibleChild)
      if (!firstVisibleChild || $elements.isTheSameNode(node, firstVisibleChild)) {
        return false
      }
    }

    previousSibling = getOwnPreviousVisibleSibling(node)

    return previousSibling && $elements.isElementNode(previousSibling) &&
               /div|p/.test($elements.getTagName(previousSibling)) && getOwnFirstVisibleTextNode(previousSibling)
  }

  return false
}

function getFirstTextNode (el, onlyVisible) {
  const children = el.childNodes
  const childrenLength = $elements.getChildNodesLength(children)
  let curNode = null
  let child = null
  let isNotContentEditableElement = null
  const checkTextNode = onlyVisible ? isVisibleTextNode : $elements.isTextNode

  if (!childrenLength && checkTextNode(el)) {
    return el
  }

  for (let i = 0; i < childrenLength; i++) {
    curNode = children[i]
    isNotContentEditableElement = $elements.isElementNode(curNode) && !$elements.isContentEditableElement(curNode)

    if (checkTextNode(curNode)) {
      return curNode
    }

    if ($elements.isRenderedNode(curNode) && hasVisibleChildren(curNode) && !isNotContentEditableElement) {
      child = getFirstTextNode(curNode, onlyVisible)

      if (child) {
        return child
      }
    }
  }

  return child
}

function getFirstVisibleTextNode (el) {
  return getFirstTextNode(el, true)
}

function getLastTextNode (el, onlyVisible) {
  const children = el.childNodes
  const childrenLength = $elements.getChildNodesLength(children)
  let curNode = null
  let child = null
  let isNotContentEditableElement = null
  let visibleTextNode = null

  if (!childrenLength && isVisibleTextNode(el)) {
    return el
  }

  for (let i = childrenLength - 1; i >= 0; i--) {
    curNode = children[i]
    isNotContentEditableElement = $elements.isElementNode(curNode) && !$elements.isContentEditableElement(curNode)
    visibleTextNode = $elements.isTextNode(curNode) &&
                                      (onlyVisible ? !isInvisibleTextNode(curNode) : true)

    if (visibleTextNode) {
      return curNode
    }

    if ($elements.isRenderedNode(curNode) && hasVisibleChildren(curNode) && !isNotContentEditableElement) {
      child = getLastTextNode(curNode, false)

      if (child) {
        return child
      }
    }
  }

  return child
}

function getFirstNonWhitespaceSymbolIndex (nodeValue, startFrom) {
  if (!nodeValue || !nodeValue.length) {
    return 0
  }

  const valueLength = nodeValue.length
  let index = startFrom || 0

  for (let i = index; i < valueLength; i++) {
    if (nodeValue.charCodeAt(i) === 10 || nodeValue.charCodeAt(i) === 32) {
      index++
    } else {
      break
    }
  }

  return index
}

function getLastNonWhitespaceSymbolIndex (nodeValue) {
  if (!nodeValue || !nodeValue.length) {
    return 0
  }

  const valueLength = nodeValue.length
  let index = valueLength

  for (let i = valueLength - 1; i >= 0; i--) {
    if (nodeValue.charCodeAt(i) === 10 || nodeValue.charCodeAt(i) === 32) {
      index--
    } else {
      break
    }
  }

  return index
}

function isInvisibleTextNode (node) {
  if (!$elements.isTextNode(node)) {
    return false
  }

  const nodeValue = node.nodeValue
  const firstVisibleIndex = getFirstNonWhitespaceSymbolIndex(nodeValue)
  const lastVisibleIndex = getLastNonWhitespaceSymbolIndex(nodeValue)

  return firstVisibleIndex === nodeValue.length && lastVisibleIndex === 0
}

function isVisibleTextNode (node) {
  return $elements.isTextNode(node) && !isInvisibleTextNode(node)
}

function isSkippableNode (node) {
  return !$elements.isRenderedNode(node) || $elements.isShadowUIElement(node)
}

//dom utils
function hasContentEditableAttr (el) {
  const attrValue = el.getAttribute ? el.getAttribute('contenteditable') : null

  return attrValue === '' || attrValue === 'true'
}

function findContentEditableParent (element) {
  const elParents = $elements.getParents(element)

  if (hasContentEditableAttr(element) && $elements.isContentEditableElement(element)) {
    return element
  }

  const currentDocument = $elements.findDocument(element)

  if (currentDocument.designMode === 'on') {
    return currentDocument.body
  }

  return arrayUtils.find(elParents, (parent) => {
    return hasContentEditableAttr(parent) &&
                                                $elements.isContentEditableElement(parent)
  })
}

function getNearestCommonAncestor (node1, node2) {
  if ($elements.isTheSameNode(node1, node2)) {
    if ($elements.isTheSameNode(node2, findContentEditableParent(node1))) {
      return node1
    }

    return node1.parentNode
  }

  const ancestors = []
  const contentEditableParent = findContentEditableParent(node1)
  let curNode = null

  if (!$elements.isElementContainsNode(contentEditableParent, node2)) {
    return null
  }

  for (curNode = node1; curNode !== contentEditableParent; curNode = curNode.parentNode) {
    ancestors.push(curNode)
  }

  for (curNode = node2; curNode !== contentEditableParent; curNode = curNode.parentNode) {
    if (arrayUtils.indexOf(ancestors, curNode) !== -1) {
      return curNode
    }
  }

  return contentEditableParent
}

//selection utils
function getSelectedPositionInParentByOffset (node, offset) {
  let currentNode = null
  let currentOffset = null
  const childCount = $elements.getChildNodesLength(node.childNodes)
  let isSearchForLastChild = offset >= childCount

  // NOTE: we get a child element by its offset index in the parent
  if ($elements.isShadowUIElement(node)) {
    return { node, offset }
  }

  // NOTE: IE behavior
  if (isSearchForLastChild) {
    currentNode = node.childNodes[childCount - 1]
  } else {
    currentNode = node.childNodes[offset]
    currentOffset = 0
  }

  // NOTE: skip shadowUI elements
  if ($elements.isShadowUIElement(currentNode)) {
    if (childCount <= 1) {
      return { node, offset: 0 }
    }

    isSearchForLastChild = offset - 1 >= childCount

    if (isSearchForLastChild) {
      currentNode = node.childNodes[childCount - 2]
    } else {
      currentNode = node.childNodes[offset - 1]
      currentOffset = 0
    }
  }

  // NOTE: we try to find text node
  while (!isSkippableNode(currentNode) && $elements.isElementNode(currentNode)) {
    const visibleChildren = getVisibleChildren(currentNode)

    if (visibleChildren.length) {
      currentNode = visibleChildren[isSearchForLastChild ? visibleChildren.length - 1 : 0]
    } else {
      //NOTE: if we didn't find a text node then always set offset to zero
      currentOffset = 0
      break
    }
  }

  if (currentOffset !== 0 && !isSkippableNode(currentNode)) {
    currentOffset = currentNode.nodeValue ? currentNode.nodeValue.length : 0
  }

  return {
    node: currentNode,
    offset: currentOffset,
  }
}

function getSelectionStart (el, selection, inverseSelection) {
  const startNode = inverseSelection ? selection.focusNode : selection.anchorNode
  const startOffset = inverseSelection ? selection.focusOffset : selection.anchorOffset

  let correctedStartPosition = {
    node: startNode,
    offset: startOffset,
  }

  //NOTE: window.getSelection() can't returns not rendered node like selected node, so we shouldn't check it
  if (($elements.isTheSameNode(el, startNode) || $elements.isElementNode(startNode)) && hasSelectableChildren(startNode)) {
    correctedStartPosition = getSelectedPositionInParentByOffset(startNode, startOffset)
  }

  return {
    node: correctedStartPosition.node,
    offset: correctedStartPosition.offset,
  }
}

function getSelectionEnd (el, selection, inverseSelection) {
  const endNode = inverseSelection ? selection.anchorNode : selection.focusNode
  const endOffset = inverseSelection ? selection.anchorOffset : selection.focusOffset

  let correctedEndPosition = {
    node: endNode,
    offset: endOffset,
  }

  //NOTE: window.getSelection() can't returns not rendered node like selected node, so we shouldn't check it
  if (($elements.isTheSameNode(el, endNode) || $elements.isElementNode(endNode)) && hasSelectableChildren(endNode)) {
    correctedEndPosition = getSelectedPositionInParentByOffset(endNode, endOffset)
  }

  return {
    node: correctedEndPosition.node,
    offset: correctedEndPosition.offset,
  }
}

function getSelection (el, selection, inverseSelection) {
  return {
    startPos: getSelectionStart(el, selection, inverseSelection),
    endPos: getSelectionEnd(el, selection, inverseSelection),
  }
}

function getSelectionStartPosition (el, selection, inverseSelection) {
  const correctedSelectionStart = getSelectionStart(el, selection, inverseSelection)

  return calculatePositionByNodeAndOffset(el, correctedSelectionStart)
}

function getSelectionEndPosition (el, selection, inverseSelection) {
  const correctedSelectionEnd = getSelectionEnd(el, selection, inverseSelection)

  return calculatePositionByNodeAndOffset(el, correctedSelectionEnd)
}

function getElementOffset (target) {
  let offset = 0

  const firstBreakElement = arrayUtils.find(target.childNodes, (node, index) => {
    offset = index

    return $elements.getTagName(node) === 'br'
  })

  return firstBreakElement ? offset : 0
}

function isNodeSelectable (node, includeDescendants) {
  if (styleUtils.isNotVisibleNode(node)) {
    return false
  }

  if ($elements.isTextNode(node)) {
    return true
  }

  if (!$elements.isElementNode(node)) {
    return false
  }

  if (hasSelectableChildren(node)) {
    return includeDescendants
  }

  const isContentEditableRoot = !$elements.isContentEditableElement(node.parentNode)
  const visibleChildren = getVisibleChildren(node)
  const hasBreakLineElements = arrayUtils.some(visibleChildren, (child) => {
    return $elements.getTagName(child) === 'br'
  })

  return isContentEditableRoot || hasBreakLineElements
}

function calculateNodeAndOffsetByPosition (el, offset) {
  let point = {
    node: null,
    offset,
  }

  function checkChildNodes (target) {
    const childNodes = target.childNodes
    const childNodesLength = $elements.getChildNodesLength(childNodes)

    if (point.node) {
      return point
    }

    if (isSkippableNode(target)) {
      return point
    }

    if ($elements.isTextNode(target)) {
      if (point.offset <= target.nodeValue.length) {
        point.node = target

        return point
      }

      if (target.nodeValue.length) {
        if (!point.node && isNodeAfterNodeBlockWithBreakLine(el, target)) {
          point.offset--
        }

        point.offset -= target.nodeValue.length
      }
    } else if ($elements.isElementNode(target)) {
      if (!isVisibleNode(target)) {
        return point
      }

      if (point.offset === 0 && isNodeSelectable(target, false)) {
        point.node = target
        point.offset = getElementOffset(target)

        return point
      }

      if (!point.node && (isNodeBlockWithBreakLine(el, target) || isNodeAfterNodeBlockWithBreakLine(el, target))) {
        point.offset--
      } else if (!childNodesLength && $elements.getTagName(target) === 'br') {
        point.offset--
      }
    }

    arrayUtils.forEach(childNodes, (node) => {
      point = checkChildNodes(node)
    })

    return point
  }

  return checkChildNodes(el)
}

function calculatePositionByNodeAndOffset (el, { node, offset }) {
  let currentOffset = 0
  let find = false

  function checkChildNodes (target) {
    const childNodes = target.childNodes
    const childNodesLength = $elements.getChildNodesLength(childNodes)

    if (find) {
      return currentOffset
    }

    if ($elements.isTheSameNode(node, target)) {
      if (isNodeBlockWithBreakLine(el, target) || isNodeAfterNodeBlockWithBreakLine(el, target)) {
        currentOffset++
      }

      find = true

      return currentOffset + offset
    }

    if (isSkippableNode(target)) {
      return currentOffset
    }

    if (!childNodesLength && target.nodeValue && target.nodeValue.length) {
      if (!find && isNodeAfterNodeBlockWithBreakLine(el, target)) {
        currentOffset++
      }

      currentOffset += target.nodeValue.length
    } else if (!childNodesLength && $elements.isElementNode(target) && $elements.getTagName(target) === 'br') {
      currentOffset++
    } else if (!find && (isNodeBlockWithBreakLine(el, target) || isNodeAfterNodeBlockWithBreakLine(el, target))) {
      currentOffset++
    }

    arrayUtils.forEach(childNodes, (currentNode) => {
      currentOffset = checkChildNodes(currentNode)
    })

    return currentOffset
  }

  return checkChildNodes(el)
}

function getElementBySelection (selection) {
  const el = getNearestCommonAncestor(selection.anchorNode, selection.focusNode)

  return $elements.isTextNode(el) ? el.parentElement : el
}

//NOTE: We can not determine first visible symbol of node in all cases,
// so we should create a range and select all text contents of the node.
// Then range object will contain information about node's the first and last visible symbol.
function getFirstVisiblePosition (el) {
  const firstVisibleTextChild = $elements.isTextNode(el) ? el : getFirstVisibleTextNode(el)
  const curDocument = $elements.findDocument(el)
  const range = curDocument.createRange()

  if (firstVisibleTextChild) {
    range.selectNodeContents(firstVisibleTextChild)

    return calculatePositionByNodeAndOffset(el, { node: firstVisibleTextChild, offset: range.startOffset })
  }

  return 0
}

function getLastVisiblePosition (el) {
  const lastVisibleTextChild = $elements.isTextNode(el) ? el : getLastTextNode(el, true)

  if (!lastVisibleTextChild || isResetAnchorOffsetRequired(lastVisibleTextChild, el)) {
    return 0
  }

  const curDocument = $elements.findDocument(el)
  const range = curDocument.createRange()

  range.selectNodeContents(lastVisibleTextChild)

  return calculatePositionByNodeAndOffset(el, { node: lastVisibleTextChild, offset: range.endOffset })
}

function isResetAnchorOffsetRequired (lastVisibleTextChild, el) {
  const firstVisibleTextChild = $elements.isTextNode(el) ? el : getFirstTextNode(el, false)
  const isSingleTextNode = lastVisibleTextChild === firstVisibleTextChild
  const isNewLineChar = lastVisibleTextChild.nodeValue === String.fromCharCode(10)

  return isSingleTextNode && isNewLineChar && hasWhiteSpacePreStyle(lastVisibleTextChild, el)
}

function hasWhiteSpacePreStyle (el, container) {
  const whiteSpacePreStyles = ['pre', 'pre-wrap', 'pre-line']

  while (el !== container) {
    el = el.parentNode

    if (arrayUtils.indexOf(whiteSpacePreStyles, styleUtils.get(el, 'white-space')) > -1) {
      return true
    }
  }

  return false
}

function getContentEditableNodes (target) {
  let result = []
  const childNodes = target.childNodes
  const childNodesLength = $elements.getChildNodesLength(childNodes)

  if (!isSkippableNode(target) && !childNodesLength && $elements.isTextNode(target)) {
    result.push(target)
  }

  arrayUtils.forEach(childNodes, (node) => {
    result = result.concat(getContentEditableNodes(node))
  })

  return result
}

// contents util
function getContentEditableValue (target) {
  return arrayUtils.map(getContentEditableNodes(target), (node) => {
    return node.nodeValue
  }).join('')
}
