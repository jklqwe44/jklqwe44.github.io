// 棋盤線數
const BOARD_SIZE = 9
// 連珠勝利條件
const WIN_SIZE = 5
// 計算勝負用陣列
const NEIGHBOR_LIST = Array(WIN_SIZE-1).fill(null).map((_,i) => i + 1)

// 一維座標 轉 二維
const coordinate = index => ({
  row: Math.floor(index/BOARD_SIZE),
  col: index%BOARD_SIZE
})

// 計算勝負
const calculateWinner = squares => {
  let winner = null
  squares.some((item,index,array) => {
    const { player } = item
    //格子不為空
    if(player) { 
      const {row , col } = coordinate(index)
      //右方
      let hasRight = col <= (BOARD_SIZE - WIN_SIZE) &&
        NEIGHBOR_LIST.every(i => {
          const { player: neighbor } = array[index+i]
          return neighbor === player
        })
      
      //下方
      let hasDown = row <= (BOARD_SIZE - WIN_SIZE) &&
        NEIGHBOR_LIST.every(i => {
          const { player: neighbor } = array[index+BOARD_SIZE*i]
          return neighbor === player
        })
      
      //右下
      let hasRightDown = col <= (BOARD_SIZE - WIN_SIZE) && 
        row <= (BOARD_SIZE - WIN_SIZE) &&
        NEIGHBOR_LIST.every(i => {
          const { player: neighbor } = array[index+i+BOARD_SIZE*i]
          return neighbor === player
        })

      //左下
      let hasLeftDown = col >= WIN_SIZE - 1  &&
        row <= (BOARD_SIZE - WIN_SIZE) &&
        NEIGHBOR_LIST.every(i => {
          const { player: neighbor } = array[index-i+BOARD_SIZE*i]
          return neighbor === player
        })

      if(hasRight || hasDown || hasRightDown || hasLeftDown) {
        winner=player
        return true
      }
    }
  })
  return winner;
}

// 棋子
const Piece = ({ className, isBlur, value }) => (
  <div 
    className={classNames(
      "piece",
      {
       "none": !value,
       "black": value === 1, 
       "white": value === 2,
       "blur": isBlur
      }, 
      className
    )} 
  />
)

// 遊戲紀錄軸 可移入呈現 與 點擊跳轉 紀錄的盤面
const GameRecord = React.forwardRef(({ list, onRecordHover, onRecordClick }, ref) => (
  <div className="game-record" ref={ref}>
    {list.map(item => {
      const {player, index, round} = item
      const {row , col } = coordinate(index)
      return (
        <div 
          className="game-record-item" 
          key={`game-record-${index}`}
          role="button"
          onMouseOver={() => onRecordHover(round)}
          onMouseOut={() => onRecordHover(null)}
          onClick={() => onRecordClick(round)}
        >
          <div className="round">
            {round + 1}
          </div>
          <div className="info">
            <Piece className="piece" value={player} />
            {`${String.fromCharCode(col + 65)},${row + 1}`}
          </div>
        </div>
      )
    })}
  </div>
))

// 遊戲狀態
const GameInfo = ({ round, player, isWin }) => (
  <div className="game-info">
    <Piece className="piece" value={player} />
    <div className="text">
      {isWin ? 'Win' : `Round ${round + 1}`}
    </div>
  </div>
)

// 下棋格 與 底線、座標 
const Square = ({ children, row, col, onClick }) => (
  <div 
    className={classNames(
      "square",
      {'has-backline': row < BOARD_SIZE-1 && col < BOARD_SIZE-1 }
    )} 
    role="button"
    onClick={onClick}
  >
    {children}
    {row === 0 && <div className='coordinate col'>{String.fromCharCode(col + 65)}</div>}
    {col === 0 && <div className='coordinate row'>{row + 1}</div>}
  </div>
)

// 棋盤
const Board = ({ squares, onSquareClick }) => (
  <div className="board-width-container">
    <div className="board-container">
      <div className="board">
        {Array(BOARD_SIZE).fill(null).map((_, i) => 
          <div key={`row-${i}`} className="row">
            {Array(BOARD_SIZE).fill(null).map((_, j) => 
              {
                const index = i*BOARD_SIZE + j
                const { player, isBlur } = squares[index]
                return (
                  <Square
                    key={`square-${index}`}
                    row={i}
                    col={j}
                    onClick={() => onSquareClick(index)}
                  >
                    <Piece isBlur={isBlur} value={player} />
                  </Square>
                )
              }
            )}
          </div>
        )}
      </div>
    </div>
  </div>
)

function Game() {
  const [gameInfo, setGameInfo] = React.useState({ player: 1, round: 0, isWin: false});
  const [gameRecord, setGameRecord] = React.useState([]);
  const gameRecordRef = React.useRef(null); 
  const [squares, setSquares] = React.useState(
    Array(BOARD_SIZE*BOARD_SIZE).fill({ player: null, round: null, isBlur: false})
  );

  // 遊戲紀錄scroll保持在最末
  React.useEffect(()=> {
    if(gameRecordRef.current) {
      gameRecordRef.current.scrollLeft = gameRecordRef.current.scrollWidth;
    }
  }, [gameRecord.length])

  // 更新盤面狀態 執棋者 回合數 輸贏
  const updateGameInfo = (nowRound, newSquares) => {
    const winner = calculateWinner(newSquares)
    if(winner) {
      setGameInfo({player: winner, round: nowRound, isWin: true})
    } else {
    const newRound = nowRound + 1
      setGameInfo({ player: newRound % 2 + 1, round: newRound, isWin: false})
    }
  }

  // 點擊棋盤空位 下棋
  const handleSquareClick = index => {
    const { round, isWin } = gameInfo
    const { player } = squares[index]
    if(!player && !isWin) {
      const newPlayer = round % 2 + 1
    
      const newSquares = [...squares]
      newSquares[index] = { player: newPlayer, round }
      setSquares(newSquares)
    
      const newGameRecord = [...gameRecord].concat({player: newPlayer, round, index})
      setGameRecord(newGameRecord)

      updateGameInfo(round, newSquares)
    }
  }

  // 預看紀錄 呈現記錄點盤面
  const handleRecordHover = round => {
    const newSquares = [...squares]
    setSquares(newSquares.map(item => {
      const { round: itemRound  } = item
      return {
        ...item,
        isBlur: round !== null && itemRound > round
      }
    }))
  }

  // 點選紀錄 盤面退回記錄點
  const handleRecordClick = round => {
    const newSquares = [...squares].map(item => {
      const { round: itemRound  } = item
      if(itemRound <= round) {
        return item
      }
      return { player: null, round: null, isBlur: false}
    })
    setSquares(newSquares)

    const newGameRecord = [...gameRecord].filter(
      ({ round: itemRound }) => itemRound <= round
    )
    setGameRecord(newGameRecord)

    updateGameInfo(round, newSquares)
  }

  const { player, isWin } = gameInfo

  return (
    <div className={classNames(
      "game",
      {"black-round": !isWin && player === 1,
        "white-round": !isWin && player === 2 }
      )} 
      >
      <GameInfo {...gameInfo} />
      <Board
        squares={squares}
        onSquareClick={handleSquareClick}
      />
      <GameRecord 
        ref={gameRecordRef} 
        list={gameRecord}
        onRecordHover={handleRecordHover}
        onRecordClick={handleRecordClick}
      />
    </div>
  );
}

ReactDOM.render(<Game />, document.getElementById("root"));
