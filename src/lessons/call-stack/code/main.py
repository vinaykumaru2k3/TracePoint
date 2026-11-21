def fact(n):                       # @a cs.sig
    if n == 0: return 1            # @a cs.base
    sub = fact(n - 1)              # @a cs.rec
    return n * sub                 # @a cs.ret

print(fact(4))                     # @a cs.main
