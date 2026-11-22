class TrieNode {
    TrieNode[] kids = new TrieNode[26];
    boolean end;
}

class Trie {
    TrieNode root = new TrieNode();

    void insert(String w) {                         // @a ins.sig
        TrieNode n = root;                          // @a ins.root
        for (char c : w.toCharArray()) {
            int i = c - 'a';
            if (n.kids[i] == null)                  // @a ins.new
                n.kids[i] = new TrieNode();         // @a ins.new
            n = n.kids[i];                          // @a ins.step
        }
        n.end = true;                               // @a ins.end
    }

    TrieNode walk(String s) {                       // @a walk.sig
        TrieNode n = root;
        for (char c : s.toCharArray()) {
            n = n.kids[c - 'a'];                    // @a walk.step
            if (n == null) return null;             // @a walk.miss
        }
        return n;                                   // @a walk.ret
    }

    boolean search(String w) {                      // @a find.sig
        TrieNode n = walk(w);
        return n != null && n.end;                  // @a find.end
    }

    boolean startsWith(String p) {                  // @a pre.sig
        return walk(p) != null;                     // @a pre.ret
    }
}
