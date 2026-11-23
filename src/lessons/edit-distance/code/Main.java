import java.util.ArrayList;
import java.util.List;

class EditDistance {
    static int editDistance(String a, String b) {
        int n = a.length(), m = b.length();
        int[][] dp = new int[n + 1][m + 1];                       // @a ed.init
        for (int i = 0; i <= n; i++) dp[i][0] = i;                // @a ed.edgecol
        for (int j = 0; j <= m; j++) dp[0][j] = j;                // @a ed.edgerow
        for (int i = 1; i <= n; i++) {                            // @a ed.row
            for (int j = 1; j <= m; j++) {                        // @a ed.col
                if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];   // @a ed.match
                else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));   // @a ed.min
            }
        }
        List<String> edits = new ArrayList<>();
        int i = n, j = m;                                         // @a ed.tbstart
        while (i > 0 || j > 0) {                                  // @a ed.trace
            if (i > 0 && j > 0 && a.charAt(i - 1) == b.charAt(j - 1)) { edits.add(0, "keep " + a.charAt(i - 1)); i--; j--; }   // @a ed.tbmatch
            else if (i > 0 && j > 0 && dp[i][j] == dp[i - 1][j - 1] + 1) { edits.add(0, "replace " + b.charAt(j - 1)); i--; j--; }   // @a ed.tbrep
            else if (i > 0 && dp[i][j] == dp[i - 1][j] + 1) { edits.add(0, "delete " + a.charAt(i - 1)); i--; }   // @a ed.tbdel
            else { edits.add(0, "insert " + b.charAt(j - 1)); j--; }   // @a ed.tbins
        }
        System.out.println(edits);                                // @a ed.print
        return dp[n][m];                                          // @a ed.ret
    }
}
