#include <string>

std::string reverse(const std::string& s) {         // @a rev.sig
    std::string out;                                // @a rev.new
    out.reserve(s.size());
    for (int i = (int)s.size() - 1; i >= 0; i--) {  // @a rev.loop
        out.push_back(s[i]);                        // @a rev.append
    }
    return out;                                     // @a rev.return
}

bool isPalindrome(const std::string& s) {           // @a pal.sig
    return s == reverse(s);                         // @a pal.check
}
