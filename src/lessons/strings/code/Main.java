class Words {
    static String reverse(String s) {                   // @a rev.sig
        StringBuilder sb = new StringBuilder();         // @a rev.new
        for (int i = s.length() - 1; i >= 0; i--) {     // @a rev.loop
            sb.append(s.charAt(i));                     // @a rev.append
        }
        return sb.toString();                           // @a rev.return
    }

    static boolean isPalindrome(String s) {             // @a pal.sig
        return s.equals(reverse(s));                    // @a pal.check
    }
}
