def reverse(s):                                # @a rev.sig
    parts = []                                 # @a rev.new
    for i in range(len(s) - 1, -1, -1):        # @a rev.loop
        parts.append(s[i])                     # @a rev.append
    return "".join(parts)                      # @a rev.return


def is_palindrome(s):                          # @a pal.sig
    return s == reverse(s)                     # @a pal.check
