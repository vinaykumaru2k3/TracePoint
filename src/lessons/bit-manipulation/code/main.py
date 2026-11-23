def and_(a, b): return a & b                       # @a bit.and
def or_(a, b): return a | b                        # @a bit.or
def xor(a, b): return a ^ b                        # @a bit.xor
def shl(a, k): return (a << k) & 0xFF              # @a bit.shl
def shr(a, k): return a >> k                       # @a bit.shr

def count(n):
    count = 0
    while n != 0:                                  # @a bit.loop
        n = n & (n - 1)                            # @a bit.clear
        count += 1                                 # @a bit.tally
    return count                                   # @a bit.ret

def is_pow2(n): return n > 0 and (n & (n - 1)) == 0   # @a bit.pow2
