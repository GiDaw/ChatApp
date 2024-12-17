import { useState, useMemo, useCallback, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import '../styles/chessboard.css';
import {socket} from '../socket'

function Game() {
  const chess = useMemo(() => new Chess(), []); // <- 1
  const [fen, setFen] = useState(chess.fen()); // <- 2
  const [over, setOver] = useState("");
  const [lock, setLock] = useState(true);
  const [side, setSide] = useState("black");
  var currentTurn;

  
  if(lock == true){
    currentTurn =  side;
  }
  else{
    if(side == "black")
    currentTurn =  "white";
    if(side == "white")
    currentTurn =  "black";
  }

  const makeAMove = useCallback(
    (move) => {
      try {
        const result = chess.move(move); // update Chess instance
        setFen(chess.fen()); // update fen state to trigger a re-render
  
        console.log("over, checkmate", chess.isGameOver(), chess.isCheckmate());
  
        if (chess.isGameOver()) { // check if move led to "game over"
          if (chess.isCheckmate()) { // if reason for game over is a checkmate
            // Set message to checkmate. 
            setOver(
              `Checkmate! ${chess.turn() === "w" ? "black" : "white"} wins!`
            ); 
            // The winner is determined by checking which side made the last move
          } else if (chess.isDraw()) { // if it is a draw
            setOver("Draw"); // set message to "Draw"
          } else {
            setOver("Game over");
          }
        }
  
        return result;
      } catch (e) {
        return null;
      } // null if the move was illegal, the move object if the move was legal
    },
    [chess]
  );


  // onDrop function
  function onDrop(sourceSquare, targetSquare) {
    if (lock == true){

        const moveData = {
            from: sourceSquare,
            to: targetSquare,
            color: chess.turn(),
            // promotion: "q",
          };
          const move = makeAMove(moveData);
          // illegal move
          if (move === null) return false;
            
          setLock(false);
          socket.emit("move", move);
          return true;
    }

    return false;

  }


  useEffect(()=>{
    socket.on("updateChessBoard", (move) => {
        makeAMove(move); //
        setLock(true)
      });
    socket.on("orientChessBoard", (ori) => {
        setSide(ori)
      });
    return()=>{
        socket.off("updateChessBoard", (move) => {
            makeAMove(move); //
            setLock(true)
          });
        socket.off("orientChessBoard", (ori) => {

            setSide(ori)
          });
    };
  },[makeAMove]);
  // Game component returned jsx
  return (
    <div>
        <Chessboard 
         position={fen}
         onPieceDrop={onDrop} 
         boardWidth={560}
         boardOrientation={side}  />

        <h1>Teraz rusza sie {currentTurn} , {over}</h1>
    </div>
  );
}

export default Game;