"use strict"

let board = null
const game = new Chess()
let status = ''
const whiteSquareGrey = '#a9a9a9'
const blackSquareGrey = '#333333'

let pauseGame = 0

let squareClass = 'square-55d63'
let squareToHighlight = null
let colorToHighlight = null

let player1 = ''
let player2 = ''

let player1Score = 0
let player2Score = 0

let gameSeq = 1

let computer = {
    comPlayers: ['player1-com', 'player2-com']
}

let aiState = 2

let playerAiSetting = {
    w: 1,
    b: 1
}

let dimensionState = 2

let config = {
    draggable: true,
    position: '',
    orientation: 'white',
    backgroundColor: 0xEAEAEA,
    rotateControls: true,
    zoomControls: true,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd
}

// let startCount = setInterval(startCountDown, 1000)

jQuery(document).ready(function ($) {

    setUpBoard(2)

    countdown(10)

    $('#player1').on('change ', changeAvatar)

    $('#player2').on('change', changeAvatar)

    $('#enter-game-btn').on('click', enterGameHandler)

    $('#start-game-btn').on('click', startGameHandler)

    $('#fen-submit-btn').on('click', setPositionHandler)

    $('#go-to-game').on('click', initGameHandler)

    $('#pause-btn').on('click', gamePaused)

    $('#game-resume-btn').on('click', gameResume)

    $('#reset-btn').on('click', gameReset)

    $('#flip-orientation').on('click', flipBoard)

    $('#board-notation').on('change', toggleBoardNotation)

    $('#player1-com').on('change', toggleCom)

    $('#player2-com').on('change', toggleCom)

    $('#com-ai').on('change', toggleAi)

    $('#toggle-dimension').on('change', toggleBoardDimension)

    $('#setup-btn').on('click', goToSetup)

    $('#timer-stop').on('click', stopCountDown)

    $('#dark-mode').on('click', toggleDark)

    $('#save-game').on('click', saveGame)

    $('#load-game').on('click', loadGame)

})

function setUpBoard(dimensions) {

    if (dimensions >= 3) {
        $('#board1').addClass('board3d')
        $('#board1').removeClass('board2d')
        board = ChessBoard3('board1', config)
        $(window).resize(board.resize)
    } else {
        $('#board1').addClass('board2d')
        $('#board1').removeClass('board3d')
        board = Chessboard('board1', config)
        $(window).resize(board.resize)
    }
}

function enterGameHandler() {

    $('#game-init').css('visibility', 'collapse')
    $('#game-interface ').css('visibility', 'visible')

}

function initGameHandler(event) {

    event.preventDefault()

    pauseGame = 0

    let player1 = $('#player1-input').val().trim()
    let player2 = $('#player2-input').val().trim()

    let player1Color = $('#player1-color').val()
    let player2Color = $('#player2-color').val()

    $('#player1-name').val(player1)
    $('#player2-name').val(player2)

    $('#player1-color-div').css('background-color', player1Color)
    $('#player2-color-div').css('background-color', player2Color)

    let player1Pic = $('#player1-avatar').attr('src')
    $('#player1-status').find('img').attr('src', player1Pic)

    let player2Pic = $('#player2-avatar').attr('src')
    $('#player2-status').find('img').attr('src', player2Pic)

    $('.body-container').removeClass('blurred-effect')
    $('#game-interface ').css('visibility', 'collapse')
}

function startGameHandler() {

    pauseGame = 0

    board.start()
    updateStatus()

    $('#player1-score').text(player1Score)
    $('#player2-score').text(player1Score)

    $('#start-game-btn').attr('disabled', '')
    $('#reset-btn').removeAttr('disabled')
    $('#fen-submit-btn').removeAttr('disabled')

    window.setTimeout(computerMoves, 2000)

    config.position = game.fen()
}

function onDragStart(source, piece) {

    // do not pick up pieces if the game is over
    if (game.game_over()) return false

    // or if it's not that side's turn
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
}

function greySquare(square) {
    const $square = $('#board1 .square-' + square)

    let background = whiteSquareGrey
    if ($square.hasClass('black-3c85d')) {
        background = blackSquareGrey
    }
    $square.css('background', background)
    let circleDiv = $('<div>')
    circleDiv.attr('id', 'hover-circle')
    $square.append(circleDiv)
}

function removeGreySquares() {
    $('#board1 .square-55d63').css('background', '')
    $('#board1 #hover-circle').remove()
}

function onDrop(source, target) {
    removeGreySquares()

    // see if the move is legal
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })

    // illegal move
    if (move === null) return 'snapback'


    if (move.color === 'w') {
        $('#board1').find('.' + squareClass).removeClass('highlight-white')
        $('#board1').find('.square-' + move.from).addClass('highlight-white')
        squareToHighlight = move.to
        colorToHighlight = 'white'
    } else {
        $('#board1').find('.' + squareClass).removeClass('highlight-black')
        $('#board1').find('.square-' + move.from).addClass('highlight-black')
        squareToHighlight = move.to
        colorToHighlight = 'black'
    }
}

function onMouseoverSquare(square, piece) {
    // get list of possible moves for this square
    const moves = game.moves({
        square: square,
        verbose: true
    })

    // exit if there are no moves available for this square
    if (moves.length === 0 || aiState === 2) return

    // highlight the square they moused over
    greySquare(square)

    // highlight the possible squares for this piece
    for (let i = 0; i < moves.length; i++) {
        greySquare(moves[i].to)
    }
}

function onMouseoutSquare(square, piece) {
    removeGreySquares()
}

function onSnapEnd() {

    removeGreySquares()

    $('#board1').find('.square-' + squareToHighlight)
        .addClass('highlight-' + colorToHighlight)

    config.position = game.fen()

    updateMoveHistory()
    updateStatus()

    window.setTimeout(computerMoves, 2000)
}

function updateMoveHistory() {

    let gameMovesHtml = game.pgn().split(" ")
    let actualGameMoves = gameMovesHtml[gameMovesHtml.length - 1]

    if (status === 'White to move') {

        let moveDiv = $('<div>')
        moveDiv.text(actualGameMoves)
        $('#white-moves').append(moveDiv)

        let seqDiv = $('<div>')
        seqDiv.text(gameSeq)
        $('#moves-sequence').append(seqDiv)
        gameSeq++

    } else if (status === 'Black to move') {

        let moveDiv = $('<div>')
        moveDiv.text(actualGameMoves)
        $('#black-moves').append(moveDiv)
    }
}

function updateStatus() {

    let moveColor = 'White'

    $('#player1-turn').css('background-color', 'red')
    $('#player2-turn').css('background-color', '')

    if (game.turn() === 'b') {

        moveColor = 'Black'

        $('#player2-turn').css('background-color', 'red')
        $('#player1-turn').css('background-color', '')
    }

    // checkmate?
    if (game.in_checkmate()) {

        if (game.turn() === "w") {

            player1Score++

            $('#player1-score').text(player1Score)

        } else if (game.turn() === "b") {

            player2Score++

            $('#player2-score').text(player2Score)

        }

        status = 'Game over, ' + moveColor + ' is in checkmate.'
    }

    // draw?
    else if (game.in_draw()) {
        status = 'Game over, drawn position'
    }

    // game still on
    else {
        status = moveColor + ' to move'

        // check?
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check'
        }
    }
    $('#status').text(status)
}

function setPositionHandler(event) {

    event.preventDefault()

    let results = $('#fen-position-input').val().trim()

    if (results === "") {

        alert(`please put in the correct FEN string`)

        return
    }

    if (confirm("Are you sure?") === true) {

        gameSeq = 1

        game.load(results)
        board.position(results)
        $(window).resize(board.resize)
        updateStatus()

        $('#player1-score').text(player1Score)
        $('#player2-score').text(player1Score)

        $('#start-game-btn').attr('disabled', '')
        $('#fen-position-input').val("")

        $('#white-moves').empty()
        $('#black-moves').empty()
        $('#moves-sequence').empty()

        window.setTimeout(computerMoves, 2000)

    } else {

        return
    }
}

function computerMoves() {

    let possibleMoves = game.moves()

    let randomIdx = Math.floor(Math.random() * possibleMoves.length)

    // exit if the game is over
    if (game.game_over() || aiState === 0 || pauseGame === 1) return

    if (aiState === 2) {

        window.setTimeout(computerMoves, 2000)
    }

    let currentPlayer = game.turn()

    if (playerAiSetting[currentPlayer] === 1) {

        game.move(possibleMoves[randomIdx])
        board.position(game.fen())
        config.position = game.fen()
        updateMoveHistory()
        updateStatus()
    }
}

function gamePaused() {

    pauseGame = 1

    $('.body-container').addClass('blurred-effect')
    $('#game-paused-win').css('visibility', 'visible')
}

function gameResume() {

    pauseGame = 0

    $('.body-container').removeClass('blurred-effect')
    $('#game-paused-win').css('visibility', 'collapse')

    window.setTimeout(computerMoves, 3000)
}

function gameReset() {

    if (confirm("Are you sure?") === true) {

        gameSeq = 1

        $('#white-moves').html('')
        $('#black-moves').html('')
        $('#moves-sequence').html('')

        $('#start-game-btn').removeAttr('disabled')

        if (dimensionState === 3) {

            setUpBoard(3)

        } else {

            setUpBoard(2)
        }

        game.reset()
        board.start()
        updateStatus()

        pauseGame = 1

    } else {

        return
    }
}

function flipBoard() {

    board.flip()
    if (config.orientation === 'white') {

        config.orientation = 'black'

        return
    }
    config.orientation = 'white'
}

function changeAvatar() {

    let selectedImg = $(this).find(':selected').val()
    let playerAvatar = $(this).find('img')
    playerAvatar.attr('src', selectedImg)
}

function toggleBoardNotation() {

    if ($('#board-notation').prop('checked') === true) {

        config.showNotation = true

    } else {

        config.showNotation = false
    }

    if (dimensionState === 3) {

        setUpBoard(3)

        return
    }

    setUpBoard(2)
}


function toggleCom() {

    if ($(this).attr('id') === 'player1-com') {

        if ($(this).prop('checked') === true) {

            playerAiSetting.w = 1

            $(this).parent().prev().val('Computer')

            $(this).attr('checked', 'checked')

            aiState++

        } else {

            playerAiSetting.w = 0

            $(this).removeAttr('checked')

            $(this).parent().prev().val('')

            aiState--
        }

    } else {

        if ($(this).prop('checked') === true) {

            playerAiSetting.b = 1

            $(this).parent().prev().val('Computer')

            $(this).attr('checked', 'checked')

            aiState++

        } else {

            playerAiSetting.b = 0

            $(this).removeAttr('checked')

            $(this).parent().prev().val('')

            aiState--
        }
    }
}

function toggleAi() {

    if ($(this).prop('checked') === true) {

        if (playerAiSetting.w === 1 && playerAiSetting.b === 1) {
            aiState = 2
            window.setTimeout(computerMoves, 2000)
        } else {

            aiState = 1
            window.setTimeout(computerMoves, 2000)
        }

    } else {

        aiState = 0
    }
}

function toggleBoardDimension() {

    if ($('#toggle-dimension').prop('checked') === true) {

        setUpBoard(3)

        dimensionState = 3

    } else {

        setUpBoard(2)

        dimensionState = 2
    }
}

function goToSetup() {

    pauseGame = 1

    $('#game-interface ').css('visibility', 'visible')
    $('.body-container').addClass('blurred-effect')
}

function countdown(duration) {

    let counter = duration * 60
    // setInterval(() => {

    let minutes = parseInt(counter / 60, 10)
    let seconds = parseInt(counter % 60, 10)

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    $('#minutes').text(minutes)
    $('#seconds').text(seconds)
}

function startCountDown() {

    let counter = 600

    counter--
    countdown(counter / 60)
}

function stopCountDown(element) {

    clearInterval(element)
}

function toggleDark() {

    if ($(this).prop('checked') === true) {

        $('body').css('background-image', `url('https://wallpaperaccess.com/full/1961455.jpg')`)
        $('#fen-position').css('color', 'white')
        $('#status').css('color', 'white')
        $('#timer-start').removeClass('btn-outline-dark')
        $('#timer-start').addClass('btn-outline-light')
        $('#timer-stop').removeClass('btn-outline-dark')
        $('#timer-stop').addClass('btn-outline-light')
        $('#timer-reset').removeClass('btn-outline-dark')
        $('#timer-reset').addClass('btn-outline-light')
        $('.player-score').css('color', 'white')

        if (dimensionState === 3) {

            config.backgroundColor = 0x0f0f0f
            config.notationColor = 0xFFFFFF
            setUpBoard(3)

        }

    } else {

        $('body').css('background-image', `url('https://wallpaperaccess.com/full/663025.jpg')`)
        $('#fen-position').css('color', 'black')
        $('#status').css('color', 'black')
        $('#timer-start').removeClass('btn-outline-light')
        $('#timer-start').addClass('btn-outline-dark')
        $('#timer-stop').removeClass('btn-outline-light')
        $('#timer-stop').addClass('btn-outline-dark')
        $('#timer-reset').removeClass('btn-outline-light')
        $('#timer-reset').addClass('btn-outline-dark')
        $('.player-score').css('color', 'black')

        if (dimensionState === 3) {

            config.backgroundColor = 0xEAEAEA
            config.notationColor = 0x000000
            setUpBoard(3)

        }
    }
}

function saveGame(event) {

    event.preventDefault()

    if ($('#saved-game-modal').hasClass('show') !== true) {

        pauseGame = 1

        let savedGame = game.fen()

        localStorage.setItem('fen-position', savedGame)
        $('#saved-fen').html(`Please copy this FEN string of your saved game: <br /><br />
    ${savedGame}`)
    }

    let resume = (event) => {

        event.preventDefault()

        pauseGame = 0

        window.setTimeout(computerMoves, 2000)

    }

    $('#close-modal').on('click', resume)
}

function loadGame(event) {


    event.preventDefault()
    // alert(`Please use the "Load Position (FEN)" feature to load your game.`)

    let results = window.localStorage.getItem('fen-position')

    pauseGame = 0

    if (results === "") {

        alert(`there is no saved games.`)

        return
    }

    if (confirm("Are you sure?") === true) {

        gameSeq = 1

        game.load(results)
        board.position(results)
        $(window).resize(board.resize)
        updateStatus()

        $('#player1-score').text(player1Score)
        $('#player2-score').text(player1Score)

        $('#start-game-btn').attr('disabled', '')
        $('#fen-position-input').val("")

        $('#white-moves').empty()
        $('#black-moves').empty()
        $('#moves-sequence').empty()

        window.setTimeout(computerMoves, 3000)

    } else {

        return
    }
}