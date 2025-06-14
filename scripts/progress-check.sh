#!/bin/bash

# 進捗確認スクリプト - 10分ごとに実行

echo "進捗確認スクリプトを開始します（10分間隔）"
echo "停止するには Ctrl+C を押してください"

TEMPLATE="
進捗はどうですか。手が止まっているエンジニア、CTOがいないかチェックと、タスクの状況が問題ないか確認して行動してください

**みんなの相互のやりとり送信されていないことがおおい**
ちゃんとやり方共有していますか
そういう報告連絡相談ちゃんとして

あなた
president

部下
multiagent0.0 (CTO)
multiagent0.1 (エンジニア)
multiagent0.2 (エンジニア)
multiagent0.3 (エンジニア)
multiagent0.4 (エンジニア)
multiagent0.5 (エンジニア)
multiagent0.6 (エンジニア)

部下への指示の出し方

tmux send-keys -t multiagent0.0 "指示内容" && tmux send-keys -t multiagent0.0 Enter

あなたへの連絡のとり方

tmux send-keys -t president "連絡内容" && tmux send-keys -t president Enter
"

while true; do
    echo "$(date): 進捗確認を送信中..."
    tmux send-keys -t president "$TEMPLATE" && tmux send-keys -t president Enter
    echo "送信完了。次回は10分後です。"
    echo ""
    
    # 10分（600秒）待機
    sleep 600
done
