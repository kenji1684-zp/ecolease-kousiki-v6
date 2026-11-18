このフォルダに公開用のPR動画を置いてください。
------------------------------------------------------------
ファイル名： pr-movie.mp4   （company.html の data-src と合わせる）

■ 配置後にやること
  company.html 内の
      <div class="movie-stage" id="movieStage" data-ready="0" data-src="video/pr-movie.mp4">
  の data-ready を "1" に変更する。これで再生ボタンが有効になります。
  （data-ready="0" の間は「動画は準備中です」と表示され、再生はされません）

■ 推奨エンコード（Web公開用）
  ・解像度   1920×1080（16:9）※そのままでOK
  ・コーデック H.264（High Profile）／音声 AAC 128kbps
  ・ビットレート 4〜6Mbps 程度（VBR）
  ・ファイルサイズ 目安 60〜100MB以内
  ・faststart を有効にする（先頭から再生できるようになります）

  ffmpeg の例：
    ffmpeg -i 元動画.mp4 -c:v libx264 -crf 23 -preset slow -profile:v high ^
           -c:a aac -b:a 128k -movflags +faststart pr-movie.mp4

  ※ 撮影データそのまま（約335MB／18Mbps）だと表示が重くなります。
  ※ さらに軽くしたい場合は YouTube / Vimeo にアップして
     .movie-stage の中身を iframe に差し替える方法もおすすめです。

■ クリックするまで動画を読み込まない仕組みになっています
  ページ表示時はポスター画像（img/movie-poster.jpg）のみ読み込み、
  再生ボタンを押したときに初めて動画ファイルを取得します。
