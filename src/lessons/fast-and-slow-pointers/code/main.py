class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

def has_cycle(head):                                # @a fs.sig
    slow = fast = head                              # @a fs.init
    while fast is not None and fast.next is not None:  # @a fs.loop
        slow = slow.next                            # @a fs.slow
        fast = fast.next.next                       # @a fs.fast
        if slow is fast:                            # @a fs.meet
            return True
    return False                                    # @a fs.none
