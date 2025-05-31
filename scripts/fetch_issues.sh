#!/bin/bash

# GitHub Issueをマークダウンファイルとして保存するスクリプト

# デバッグモード（詳細出力が必要な場合は有効化）
# set -x

# 必要なコマンドがあるか確認
for cmd in curl grep sed awk; do
  if ! command -v $cmd &> /dev/null; then
    echo "エラー: $cmd コマンドが見つかりません。このスクリプトを実行するためには $cmd が必要です。"
    exit 1
  fi
done

# デフォルト設定
TOKEN=""
OWNER=""
REPO=""
OUTPUT_DIR="./issues"
DEBUG=false
MAX_PAGES=10  # 最大ページ数（1ページあたり100件）

# 使い方
usage() {
  echo "使用方法: $0 [オプション]"
  echo "オプション:"
  echo "  -h, --help           このヘルプメッセージを表示"
  echo "  -d, --debug          デバッグモードを有効化（詳細出力）"
  echo "  -o, --output=DIR     出力ディレクトリを指定（デフォルト: ./issues）"
  echo "  -t, --token=TOKEN    GitHub Personal Access Tokenを指定"
  echo "  -r, --repo=OWNER/REPO  リポジトリを「所有者/リポジトリ名」の形式で指定"
  echo "  -p, --pages=NUM      取得する最大ページ数を指定（デフォルト: 10）"
  echo ""
  echo "説明:"
  echo "  GitHub APIを使用して、指定したリポジトリの開いているissueを取得し、"
  echo "  各issueのタイトルをファイル名としたMarkdownファイルを作成します。"
  echo "  Pull Requestは除外されます。"
  echo ""
  exit 0
}

# コマンドライン引数の処理
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      usage
      ;;
    -d|--debug)
      DEBUG=true
      set -x
      shift
      ;;
    -o=*|--output=*)
      OUTPUT_DIR="${1#*=}"
      shift
      ;;
    -t=*|--token=*)
      TOKEN="${1#*=}"
      shift
      ;;
    -r=*|--repo=*)
      REPO_ARG="${1#*=}"
      # リポジトリ文字列を分割
      OWNER=$(echo $REPO_ARG | cut -d'/' -f1)
      REPO=$(echo $REPO_ARG | cut -d'/' -f2)
      shift
      ;;
    -p=*|--pages=*)
      MAX_PAGES="${1#*=}"
      shift
      ;;
    *)
      # 不明な引数
      echo "警告: 不明な引数 '$1'"
      shift
      ;;
  esac
done

# 必要な引数の確認
if [ -z "$TOKEN" ]; then
  echo "エラー: GitHub Personal Access Tokenが指定されていません。"
  echo "--token=YOUR_TOKEN オプションで指定してください。"
  exit 1
fi

if [ -z "$OWNER" ] || [ -z "$REPO" ]; then
  echo "エラー: リポジトリが指定されていません。"
  echo "--repo=OWNER/REPO オプションで指定してください。"
  exit 1
fi

# デバッグ情報
if [ "$DEBUG" = true ]; then
  echo "デバッグモード: 有効"
  echo "リポジトリ所有者: $OWNER"
  echo "リポジトリ名: $REPO"
  echo "出力ディレクトリ: $OUTPUT_DIR"
  echo "最大ページ数: $MAX_PAGES"
fi

# 出力ディレクトリが存在しない場合は作成
mkdir -p "$OUTPUT_DIR"

# 保存したIssue数をカウント
total_issues=0

# ページネーションを使用してすべてのIssueを取得
for page in $(seq 1 $MAX_PAGES); do
  if [ "$DEBUG" = true ]; then
    echo "ページ $page を取得中..."
  fi
  
  # GitHub APIでIssueを取得 - Pull Requestを除外するフィルタを使用
  response=$(curl -s -H "Authorization: token $TOKEN" \
    "https://api.github.com/repos/$OWNER/$REPO/issues?state=open&per_page=100&page=$page")
  
  # エラーチェック
  if [[ $(echo "$response" | grep -c "Bad credentials") -gt 0 ]]; then
    echo "エラー: GitHub APIの認証に失敗しました。Personal Access Tokenを確認してください。"
    exit 1
  fi
  
  if [[ $(echo "$response" | grep -c "Not Found") -gt 0 ]]; then
    echo "エラー: リポジトリが見つかりませんでした。OWNER($OWNER)とREPO($REPO)を確認してください。"
    exit 1
  fi
  
  # 結果が空配列かチェック
  if [[ "$response" == "[]" ]]; then
    if [ "$DEBUG" = true ]; then
      echo "ページ $page は空です。ページネーション終了。"
    fi
    break
  fi
  
  # 一時ファイルの作成
  TEMP_FILE=$(mktemp)
  echo "$response" > "$TEMP_FILE"
  
  # JSONを行ごとに処理し、Issue（Pull Requestでないもの）を抽出
  while IFS= read -r line; do
    if [[ "$line" == *"\"number\":"* ]]; then
      issue_number=$(echo "$line" | sed 's/.*"number": \([0-9]*\).*/\1/')
      current_issue=$issue_number
    elif [[ "$line" == *"\"pull_request\":"* ]]; then
      # Pull Requestはスキップ
      current_issue=""
    elif [[ "$line" == *"\"title\":"* ]] && [[ -n "$current_issue" ]]; then
      current_title=$(echo "$line" | sed 's/.*"title": "\(.*\)",/\1/')
    elif [[ "$line" == *"\"body\":"* ]] && [[ -n "$current_issue" ]]; then
      # body の開始を検出
      body_start=true
      body_content=$(echo "$line" | sed 's/.*"body": "\(.*\)$/\1/')
      
      # 1行のbodyかチェック
      if [[ "$line" == *"\"body\": \""*"\","* ]]; then
        body_content=$(echo "$line" | sed 's/.*"body": "\(.*\)",/\1/')
        body_complete=true
      else
        body_complete=false
      fi
    elif [[ "$body_start" == true ]] && [[ "$body_complete" == false ]] && [[ -n "$current_issue" ]]; then
      # bodyの続きを処理
      if [[ "$line" == *"\","* ]] && [[ "$line" != *"\\\","* ]]; then
        # bodyの終了を検出
        body_content="${body_content}$(echo "$line" | sed 's/\(.*\)",/\1/')"
        body_complete=true
      else
        # bodyの続き
        body_content="${body_content}${line}"
      fi
    elif [[ "$line" == *"\"login\":"* ]] && [[ -n "$current_issue" ]] && [[ -z "$current_user" ]]; then
      # ユーザー名を抽出
      current_user=$(echo "$line" | sed 's/.*"login": "\(.*\)",/\1/')
    elif [[ "$line" == *"\"created_at\":"* ]] && [[ -n "$current_issue" ]]; then
      created_at=$(echo "$line" | sed 's/.*"created_at": "\(.*\)",/\1/')
    elif [[ "$line" == *"\"updated_at\":"* ]] && [[ -n "$current_issue" ]]; then
      updated_at=$(echo "$line" | sed 's/.*"updated_at": "\(.*\)",/\1/')
    elif [[ "$line" == *"}"* ]] && [[ -n "$current_issue" ]] && [[ "$body_complete" == true ]]; then
      # Issueの終了を検出 - Markdownファイルを作成
      
      # エスケープシーケンスを処理
      body_content=$(echo "$body_content" | sed 's/\\n/\n/g' | sed 's/\\"/"/g' | sed 's/\\\\/\\/g')
      
      # ファイル名を作成（特殊文字を置換）
      filename=$(echo "$current_title" | tr -d '[:cntrl:]' | tr -c '[:alnum:] ._-' '_')
      
      # 出力ファイルパスを作成
      output_file="$OUTPUT_DIR/${filename}.md"
      
      echo "Issue #$current_issue: $current_title をファイル $output_file に保存しています..."
      
      # Markdownファイルを作成
      cat > "$output_file" << EOF
# ${current_title}

- **Issue番号:** #${current_issue}
- **作成者:** ${current_user}
- **作成日:** ${created_at}
- **更新日:** ${updated_at}

## 内容

${body_content}

---
[GitHubでこのIssueを表示](https://github.com/${OWNER}/${REPO}/issues/${current_issue})
EOF
      
      # カウンタを増やす
      total_issues=$((total_issues + 1))
      
      # 変数をリセット
      current_issue=""
      current_title=""
      current_user=""
      body_content=""
      body_start=false
      body_complete=false
    fi
  done < "$TEMP_FILE"
  
  # 一時ファイルの削除
  rm -f "$TEMP_FILE"
done

echo "完了！ 合計 $total_issues 件のIssueを保存しました。"
echo "結果は $OUTPUT_DIR ディレクトリにあります。"

# 空のタイトルのファイルを削除
find "$OUTPUT_DIR" -name ".md" -delete
