import java.util.*;

class TrieNode {
    TrieNode[] kids = new TrieNode[26];
    boolean end;
}

class Autocomplete {
    TrieNode root = new TrieNode();

    void insert(String w) {                                  // @a ins.sig
        TrieNode n = root;
        for (char c : w.toCharArray()) {
            int i = c - 'a';
            if (n.kids[i] == null) n.kids[i] = new TrieNode(); // @a ins.new
            n = n.kids[i];
        }
        n.end = true;                                        // @a ins.end
    }

    List<String> complete(String p) {                        // @a ac.sig
        TrieNode n = root;
        for (char c : p.toCharArray()) {
            n = n.kids[c - 'a'];                             // @a walk.step
            if (n == null) return new ArrayList<>();         // @a walk.miss
        }
        List<String> out = new ArrayList<>();
        collect(n, new StringBuilder(p), out);               // @a ac.collect
        return out;                                          // @a ac.ret
    }

    void collect(TrieNode n, StringBuilder sb, List<String> out) { // @a dfs.sig
        if (n.end) out.add(sb.toString());                   // @a dfs.word
        for (int i = 0; i < 26; i++) {
            if (n.kids[i] == null) continue;
            sb.append((char) ('a' + i));                     // @a dfs.down
            collect(n.kids[i], sb, out);                     // @a dfs.down
            sb.setLength(sb.length() - 1);
        }
    }
}
