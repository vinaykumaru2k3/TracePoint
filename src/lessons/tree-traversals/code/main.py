from collections import deque

class Node:
    def __init__(self, val):
        self.val, self.left, self.right = val, None, None

def preorder(n, out):                       # @a pre.sig
    if n is None: return
    out.append(n.val)                       # @a pre.visit
    preorder(n.left, out)
    preorder(n.right, out)

def inorder(n, out):                        # @a in.sig
    if n is None: return
    inorder(n.left, out)
    out.append(n.val)                       # @a in.visit
    inorder(n.right, out)

def postorder(n, out):                      # @a post.sig
    if n is None: return
    postorder(n.left, out)
    postorder(n.right, out)
    out.append(n.val)                       # @a post.visit

def level_order(root):                      # @a lvl.sig
    out = []
    q = deque([root] if root else [])       # @a lvl.init
    while q:
        n = q.popleft()                     # @a lvl.poll
        out.append(n.val)                   # @a lvl.visit
        if n.left: q.append(n.left)         # @a lvl.push
        if n.right: q.append(n.right)       # @a lvl.push
    return out                              # @a lvl.done
