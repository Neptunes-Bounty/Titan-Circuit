// Hello There! Welcome to very poorly thought out and hastily built program time!!1!
// Proceed with caution. Errors and bugs lurk in this unforgiving place. 
// Comments are available for your enjoyment (please ignore typos) 
// (added // everywhere using a script 'cause didn't want to do it everytime, sorry.)

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const board = document.getElementById('game-board'); // 
    const currentPlayerDisplay = document.getElementById('current-player');//
    const scoreRedDisplay = document.getElementById('score-red'); // CamelCase, my beloved
    const scoreBlueDisplay = document.getElementById('score-blue');// seriously, this is my first attempt at using 
    const overallTimerDisplay = document.getElementById('overall-timer');// CamelCase in this big of a project.
    const turnTimerDisplay = document.getElementById('turn-timer');
    const gamePhaseDisplay = document.getElementById('game-phase');
    const messageArea = document.getElementById('message-area');
    const pauseButton = document.getElementById('pause-button');
    const resumeButton = document.getElementById('resume-button');
    const resetButton = document.getElementById('reset-button');

    // --- Game Constants ---
    const NUM_TITANS_PER_PLAYER = 4; 
    const OVERALL_TIME_LIMIT = 10 * 60; // I think 10 minutes is plenty
    const TURN_TIME_LIMIT = 30; // 30 seconds is also fair, I think
    const CIRCUITS = ['outer', 'middle', 'inner']; 

    // --- Game State Variables ---
    let nodes = {}; // these will be populated as the game is played.
    let edgeWeights = {}; 
    let gameState = {}; 
    let overallTimerInterval = null; 
    let turnTimerInterval = null; 
    let selectedNodeId = null; 
    let isPaused = false; 

    // --- Node Definitions & Adjacency/Weights ---
    const nodePositions = {
        // Outer (Indices 0-5 clockwise from right)
        'outer-0': { circuit: 'outer', index: 0, x: 50, y: 95 }, 
        'outer-1': { circuit: 'outer', index: 1, x: 27.5, y: 72.5 }, 
        'outer-2': { circuit: 'outer', index: 2, x: 27.5, y: 27.5 }, 
        'outer-3': { circuit: 'outer', index: 3, x: 50, y: 5 },
        'outer-4': { circuit: 'outer', index: 4, x: 72.5, y: 27.5 }, 
        'outer-5': { circuit: 'outer', index: 5, x: 72.5, y: 72.5 }, 
        // Middle (Indices 0-5 clockwise from right)
        'middle-0': { circuit: 'middle', index: 0, x: 50, y: 80 }, // 
        'middle-1': { circuit: 'middle', index: 1, x: 35, y: 65 }, // 
        'middle-2': { circuit: 'middle', index: 2, x: 35, y: 35 }, // 
        'middle-3': { circuit: 'middle', index: 3, x: 50, y: 20 }, // 
        'middle-4': { circuit: 'middle', index: 4, x: 65, y: 35 }, // 
        'middle-5': { circuit: 'middle', index: 5, x: 65, y: 65 }, // 
        // Inner (Indices 0-5 clockwise from right)
        'inner-0': { circuit: 'inner', index: 0, x: 50, y: 65 }, // 
        'inner-1': { circuit: 'inner', index: 1, x: 42.5, y: 57.5 }, // 
        'inner-2': { circuit: 'inner', index: 2, x: 42.5, y: 42.5 }, // 
        'inner-3': { circuit: 'inner', index: 3, x: 50, y: 35 }, // 
        'inner-4': { circuit: 'inner', index: 4, x: 57.5, y: 42.5 }, // 
        'inner-5': { circuit: 'inner', index: 5, x: 57.5, y: 57.5 }, // 
    }; // [cite: 8]

    const edgeDefinitions = [ //
        // Edges connecting nodes within the Outer Ring
        ['outer-0', 'outer-1', 2, 'o0-o1'], ['outer-1', 'outer-2', 1, 'o1-o2'], //
        ['outer-2', 'outer-3', 2, 'o2-o3'], ['outer-3', 'outer-4', 1, 'o3-o4'], //
        ['outer-4', 'outer-5', 1, 'o4-o5'], ['outer-5', 'outer-0', 3, 'o5-o0'], //
        // Edges connecting nodes within the Middle Ring
        ['middle-0', 'middle-1', 5, 'm0-m1'], ['middle-1', 'middle-2', 6, 'm1-m2'], //
        ['middle-2', 'middle-3', 4, 'm2-m3'], ['middle-3', 'middle-4', 1, 'm3-m4'], //
        ['middle-4', 'middle-5', 1, 'm4-m5'], ['middle-5', 'middle-0', 3, 'm5-m0'], //
        // Edges connecting nodes within the Inner Ring
        ['inner-0', 'inner-1', 8, 'i0-i1'], ['inner-1', 'inner-2', 8, 'i1-i2'], //
        ['inner-2', 'inner-3', 9, 'i2-i3'], ['inner-3', 'inner-4', 8, 'i3-i4'], //
        ['inner-4', 'inner-5', 8, 'i4-i5'], ['inner-5', 'inner-0', 9, 'i5-i0'], //
        // Edges connecting nodes *between* different rings
        ['outer-0', 'middle-0', 1, 'o0-m0'], ['outer-1', 'middle-1', 0, 'o1-m1'], // I didn't know how to implement edges
        ['outer-2', 'middle-2', 1, 'o2-m2'], ['outer-3', 'middle-3', 0, 'o3-m3'], // selectively and it was breaking the
        ['outer-4', 'middle-4', 1, 'o4-m4'], ['outer-5', 'middle-5', 0, 'o5-m5'], // entire thing, so I opted for 
        ['middle-0', 'inner-0', 0, 'm0-i0'], ['middle-1', 'inner-1', 1, 'm1-i1'], // setting the edge weights to zero.
        ['middle-2', 'inner-2', 0, 'm2-i2'], ['middle-3', 'inner-3', 1, 'm3-i3'], //
        ['middle-4', 'inner-4', 0, 'm4-i4'], ['middle-5', 'inner-5', 1, 'm5-i5'], //
    ];

    // --- Initialization ---
    function initGame() { // 
        console.log("Initializing game..."); // 
        isPaused = false; // 
        selectedNodeId = null; // 
        board.innerHTML = ''; // 
        nodes = {}; // 
        edgeWeights = {}; // 
        clearTimers(); // 

        gameState = { // 
            currentPlayer: 'Red', // 
            phase: 'Placement', // Start game with placement stage
            scores: { Red: 0, Blue: 0 }, // 
            titansLeft: { Red: NUM_TITANS_PER_PLAYER, Blue: NUM_TITANS_PER_PLAYER }, // 
            placedTitans: { Red: 0, Blue: 0 }, // 
            unlockedCircuitIndex: 0, // 0: outer, 1: middle, 2: inner 
            overallTimeRemaining: OVERALL_TIME_LIMIT, // 
            turnTimeRemaining: TURN_TIME_LIMIT, // 
            gameOver: false, // 
            winner: null // 
        };

        createBoardElements(); // Creates nodes and edge weights 
        setupAdjacencies(); // 

        // This calculates the coordinates and draws lines after the nodes have been created.
        requestAnimationFrame(() => {
             calculateNodePixelCoords(); //
             createEdgeLines(); // Draws the edges
        });

        updateUI(); // 
        highlightAvailableNodes(); // 
        startOverallTimer(); // 
        startTurnTimer(); // 
        messageArea.textContent = "Red's turn to play."; // 
        pauseButton.disabled = false; // 
        resumeButton.disabled = true; // 
        console.log("Game Started~"); // 
    }

    function createBoardElements() { // 
        // Self Explanatory, jk (creates nodes)
        for (const id in nodePositions) { // 
            const pos = nodePositions[id]; // 
            const nodeEl = document.createElement('div'); // 
            nodeEl.classList.add('node'); // 
            nodeEl.id = `node-${id}`; // 
            nodeEl.dataset.nodeId = id; // storing logic id
            nodeEl.style.top = `${pos.x}%`; // 
            nodeEl.style.left = `${pos.y}%`; // 
            nodeEl.addEventListener('click', handleNodeClick); // 
            board.appendChild(nodeEl); // 

            nodes[id] = { // 
                id: id, // 
                element: nodeEl, // 
                circuit: pos.circuit, // 
                index: pos.index, // 
                occupiedBy: null, // 
                adjacencies: [], // 
                // pixelCoords will be added later
            };
        } // 

        // Create Edge Weight Spans
        edgeDefinitions.forEach(([nodeId1, nodeId2, weight, weightId]) => { // 
            const pos1 = nodePositions[nodeId1]; // 
            const pos2 = nodePositions[nodeId2]; // 
            if (!pos1 || !pos2) {
                console.error(`Position missing for node ${nodeId1} or ${nodeId2}`);
                return;
            }
            const weightEl = document.createElement('span'); // 
            weightEl.classList.add('edge-weight'); // 
            weightEl.id = `weight-${weightId}`;
            if (weight < 1) return; // 
            weightEl.textContent = weight; // EDGE weight for scoring ref 
            // Position roughly halfway between nodes
            weightEl.style.top = `${(pos1.x + pos2.x) / 2}%`; // 
            weightEl.style.left = `${(pos1.y + pos2.y) / 2}%`; // 
            board.appendChild(weightEl); // 
            edgeWeights[weightId] = { // 
                id: weightId, // 
                element: weightEl, // 
                weight: weight, // Store EDGE weight 
                node1Id: nodeId1, // 
                node2Id: nodeId2 // 
            };
        }); // 
    } // 

    // This function calculates pixle coordinates
    function calculateNodePixelCoords() {
        const boardWidth = board.offsetWidth;
        const boardHeight = board.offsetHeight;

        if (boardWidth === 0 || boardHeight === 0) {
             console.warn("Error");
             return;
        }

        for (const id in nodes) {
            const node = nodes[id];
            const pos = nodePositions[id];
            if (!pos || !node) continue;

            const pixelX = (pos.y / 100) * boardWidth;  // css left
            const pixelY = (pos.x / 100) * boardHeight; // css top
            node.pixelCoords = { x: pixelX, y: pixelY };
        }
         console.log("Done.");
    }

    // self explanatory
    function createEdgeLines() {
        const drawnEdges = new Set();

         if (Object.keys(nodes).length === 0 || !nodes[Object.keys(nodes)[0]].pixelCoords) {
             console.warn("No lines??.");
             return;
         }
         console.log("Drawing edge lines...");

        edgeDefinitions.forEach(([nodeId1, nodeId2, _weight, _weightId]) => {
            const node1 = nodes[nodeId1];
            const node2 = nodes[nodeId2];

            if (!node1 || !node2 || !node1.pixelCoords || !node2.pixelCoords) {
                 console.error(`No coords / nodes ${nodeId1}-${nodeId2}`);
                 return;
            }

             const edgeKey = [nodeId1, nodeId2].sort().join('-');
             if (drawnEdges.has(edgeKey)) return;
             drawnEdges.add(edgeKey);

            const { x: x1, y: y1 } = node1.pixelCoords;
            const { x: x2, y: y2 } = node2.pixelCoords;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length < 1) return;
            if (_weight < 1) return; // Avoid zero-length lines
            const angle = Math.atan2(dy, dx) * (180 / Math.PI); // 

            const lineEl = document.createElement('div');
            lineEl.classList.add('line'); // 
            lineEl.style.width = `${length}px`;
            lineEl.style.left = `${x1}px`;
            lineEl.style.top = `${y1}px`;
            lineEl.style.transform = `rotate(${angle}deg)`;

            board.appendChild(lineEl);
        });
         console.log("Mission: draw lines has been completely successfully");
    }


    function setupAdjacencies() { // 
        edgeDefinitions.forEach(([nodeId1, nodeId2, weight, weightId]) => { // 
            if (nodes[nodeId1] && nodes[nodeId2]) { // 
                nodes[nodeId1].adjacencies.push({ nodeId: nodeId2, weightId: weightId, weight: weight }); // 
                nodes[nodeId2].adjacencies.push({ nodeId: nodeId1, weightId: weightId, weight: weight }); // 
            } else { // 
                 console.error(`Couldn't find the Goddamn node for ${nodeId1} or ${nodeId2}`); // 
            }
        }); // 
    } // 

    // --- Game Flow & Logic --- // 

    function handleNodeClick(event) { // 
        if (isPaused || gameState.gameOver) return; // 
        const clickedNodeId = event.target.dataset.nodeId; // 
        if (!clickedNodeId) return; // Clicked something else inside the node? 
        const node = nodes[clickedNodeId]; // 
        if (gameState.phase === 'Placement') { // 
            handlePlacement(node); // 
        } else if (gameState.phase === 'Movement') { // 
            handleMovement(node); // 
        } // 
        // 
    }

    function handlePlacement(node) { // 
        const player = gameState.currentPlayer; // 
        const titansLeft = gameState.titansLeft[player]; // 
        // Titans are first Deployed fully, then the movement stage begins.
        if (titansLeft <= 0) { // 
             setMessage("All Titans deployed. Go Titans!"); // Let's see if anyone gets this reference.
             return; // 
        }
        const currentCircuit = CIRCUITS[gameState.unlockedCircuitIndex]; // 
        if (node.circuit !== currentCircuit) { // 
             setMessage(`Circuit is Locked`); // 
             return; // 
        }
        if (node.occupiedBy) { // 
             setMessage("This node is already occupied."); // 
             return; // 
        }
        // --- Execute Placement --- 
        console.log(`Placing ${player} titan on ${node.id}`); // 
        placeTitan(node, player); // 
        gameState.titansLeft[player]--; // 
        gameState.placedTitans[player]++; // 
        // Update scores 
        updateScoresForMove(null, node.id, player); // Calculate score changes  
        checkCircuitUnlock(); // Checks if circuit is full  
        checkPhaseTransition(); // Checks if all titans are placed  
        if (!gameState.gameOver) { //
            switchPlayer(); // 
            highlightAvailableNodes(); // Highlight avabilable moves
        } // Holy hell, I lost this curly brace while making this and spent an hour looking for it.
         updateUI(); // duh
    }

     function placeTitan(node, player) { // 
        node.occupiedBy = player; // 
        node.element.classList.remove('available'); // 
        node.element.classList.add(player === 'Red' ? 'red-titan' : 'blue-titan'); // 
    }

    function handleMovement(node) { // 
        const player = gameState.currentPlayer; //
        checkCircuitUnlock(); 
        if (!selectedNodeId) { // Try to Select 
            if (node.occupiedBy === player) { // 
                selectTitan(node.id); // 
            } else if (node.occupiedBy) { // 
                setMessage("Please select one of your Titan."); // 
            } else { // 
                setMessage("Select one of your Titans to move."); // 
            } // 
        } else { // Try to Move 
            const originNode = nodes[selectedNodeId]; // 
            const targetNode = node; // 
            const isAdjacent = originNode.adjacencies.some(adj => adj.nodeId === targetNode.id); // 
            const isEmpty = !targetNode.occupiedBy; // 
            if (targetNode.id === selectedNodeId) { // Clicked same node 
                deselectTitan()
                console.log("Message: Origin should be different from the destination."); // 
            } else if (isAdjacent && isEmpty && (CIRCUITS.indexOf(targetNode.circuit) <= gameState.unlockedCircuitIndex)) { // Valid Move 
                console.log(`Moving ${player} from ${originNode.id} to ${targetNode.id}`); // 
                console.log("Point4")
                updateScoresForMove(originNode.id, targetNode.id, player); // Update score BEFORE move 
                // Move titan visually
                targetNode.occupiedBy = player; // 
                targetNode.element.classList.add(player === 'Red' ? 'red-titan' : 'blue-titan'); // 
                originNode.occupiedBy = null; // 
                originNode.element.classList.remove('red-titan', 'blue-titan', 'selected'); // 
                deselectTitan(); // Clear selection  
                // Check captures AFTER move 
                checkForCaptures(targetNode.id, player); // Check if move captures opponent  
                checkForCapturesAround(targetNode.id, player); // Check if moved piece is captured  
                checkWinConditions(); // Check if game ends  
                if (!gameState.gameOver) { // 
                     switchPlayer(); //  
                }
                 updateUI(); // 
            } else if (isAdjacent && !isEmpty) { // Blocked 
                setMessage("Occupied. Find another node"); // 
                deselectTitan(); // 
            } else { // Invalid target 
                setMessage("Invalid move."); // 
                deselectTitan(); // 
            }
        }
    }

     function selectTitan(nodeId) { // 
        if (selectedNodeId) deselectTitan(); // 
        selectedNodeId = nodeId; // 
        nodes[nodeId].element.classList.add('selected'); // 
        highlightPossibleMoves(nodeId); // 
        setMessage(`Titan at ${nodeId} selected and ready to move.`); // 
    }

    function deselectTitan() { // 
        if (selectedNodeId) { // 
            nodes[selectedNodeId]?.element.classList.remove('selected'); // Chaining is a bad habit I picked
        }                                                                // up from python.
        selectedNodeId = null; //
        clearHighlights(); // Clear move highlights 
    }

     function highlightPossibleMoves(nodeId) { // 
        clearHighlights(); // Clear previous 
        const node = nodes[nodeId];
        console.log("logging") // 
        if (!node) return; // 
        node.adjacencies.forEach(adj => { // 
            const adjacentNode = nodes[adj.nodeId]; // 
            if (adjacentNode && !adjacentNode.occupiedBy && (CIRCUITS.indexOf(adjacentNode.circuit) <= gameState.unlockedCircuitIndex)) { // 
                adjacentNode.element.classList.add('possible-move'); // 
            }
        }); // 
    } // 

     function highlightAvailableNodes() { // 
        clearHighlights(); // 
        if (gameState.phase !== 'Placement' || isPaused || gameState.gameOver) return; // 
        const currentCircuit = CIRCUITS[gameState.unlockedCircuitIndex];
        for (const id in nodes) { // 
            const node = nodes[id]; // 
            if (node.circuit === currentCircuit && !node.occupiedBy) { // 
                node.element.classList.add('available'); // 
            } // 
        }
    }

    function clearHighlights() { // 
        document.querySelectorAll('.node.possible-move, .node.available').forEach(el => { // 
            el.classList.remove('possible-move', 'available'); // 
        }); // 
    } // 

     function checkCircuitUnlock() { // 
        if (gameState.unlockedCircuitIndex >= CIRCUITS.length - 1) return; // Already fully unlocked  
        const currentCircuitId = CIRCUITS[gameState.unlockedCircuitIndex]; // 
        let nodesInCircuit = 0; // 
        let occupiedNodes = 0;
        for (const id in nodes) { // 
            if (nodes[id].circuit === currentCircuitId) { // 
                nodesInCircuit++; // 
                if (nodes[id].occupiedBy) occupiedNodes++; //  
            }
        }
        console.log( "fure", occupiedNodes, nodesInCircuit)
        if (occupiedNodes >= nodesInCircuit) { // 
            gameState.unlockedCircuitIndex++; // 
            const nextCircuit = CIRCUITS[gameState.unlockedCircuitIndex]; // 
            setMessage(`Circuit ${currentCircuitId} full! Circuit ${nextCircuit} unlocked.`); // 
            highlightAvailableNodes(); // Highlight new circuit nodes  
        }
    }

    function checkPhaseTransition() { // 
        if (gameState.phase === 'Placement') { // 
            const totalPlaced = gameState.placedTitans.Red + gameState.placedTitans.Blue; // 
            if (totalPlaced >= NUM_TITANS_PER_PLAYER * 2) { // All placed 
                gameState.phase = 'Movement'; // 
                setMessage("All titans deployed. Movement phase begins."); // So dramatic, right?
                 clearHighlights(); 
            }
        }
    }

    // --- Score Calc --- 
    function updateScoresForMove(fromNodeId, toNodeId, player) { 0
        let scoreDelta = 0; 
        
        if (fromNodeId) { 
            const originNode = nodes[fromNodeId]; 
            originNode.adjacencies.forEach(adj => { 
                const neighbor = nodes[adj.nodeId]; 
                 if (neighbor.occupiedBy === player) { 
                     scoreDelta -= adj.weight; // 
                      console.log(`Score change: -${adj.weight} (lost edge ${fromNodeId}-${adj.nodeId})`); // 
                 }
                 // idk how to implement specific logic for opponent losing than just the other guy winning.
            }); // 
        } // 
         // Points gained at destination 
        const destNode = nodes[toNodeId]; // 
        destNode.adjacencies.forEach(adj => { // 
            const neighbor = nodes[adj.nodeId]; // 
             // If edge IS controlled now 
             if (neighbor.occupiedBy === player) { // 
                 scoreDelta += adj.weight; // 
                 console.log(`Score change: +${adj.weight} (gained edge ${toNodeId}-${adj.nodeId})`); // 
             } // 
        }); // 
        if (scoreDelta !== 0) { // 
            gameState.scores[player] += scoreDelta; // 
            console.log(`Total Score Delta for ${player}: ${scoreDelta}, New Score: ${gameState.scores[player]}`); // ]
        }
        updateScoreDisplay(); // 
    }

    function updateScoreDisplay() { // 
        scoreRedDisplay.textContent = gameState.scores.Red; // 
        scoreBlueDisplay.textContent = gameState.scores.Blue; // 
    }

    // --- Capture Logic --- 
    function checkForCaptures(movedToNodeId, movingPlayer) { // 
        const opponent = movingPlayer === 'Red' ? 'Blue' : 'Red'; //
        const movedNode = nodes[movedToNodeId]; // 
        // Check neighbors of destination 
        movedNode.adjacencies.forEach(adj => { // 
            const neighborNode = nodes[adj.nodeId]; // 
            if (neighborNode && neighborNode.occupiedBy === opponent) { // If neighbor is opponent 
                // Check if opponent neighbor is surrounded by mover 
                if (isSurrounded(neighborNode.id, movingPlayer)) { // 
                     captureTitan(neighborNode.id, opponent); // 
                }
            }
        });
    } 

    function checkForCapturesAround(nodeId, player) { // 
        // Check if moved piece itself is surrounded by opponent 
         const opponent = player === 'Red' ? 'Blue' : 'Red'; // 
         if(isSurrounded(nodeId, opponent)) { // 
             captureTitan(nodeId, player); // 
         } // 
    }

    function isSurrounded(nodeId, surroundingPlayer) { // 
        const node = nodes[nodeId]; // 
        if (!node || !node.occupiedBy) return false; // Cannot capture empty node
        if (node.adjacencies.length === 0) return false; // Cannot be surrounded 
        // Check ALL adjacent nodes 
        for (const adj of node.adjacencies) { // 
            const neighbor = nodes[adj.nodeId]; // 
            if (!neighbor || neighbor.occupiedBy !== surroundingPlayer) { // Not surrounded if any neighbor isn't opponent 
                return false; // , 111]
            }
        }
        console.log(`Node ${nodeId} (${node.occupiedBy}) is surrounded by ${surroundingPlayer}`); // Who comes up with these mechanics, man?
        return true; // All neighbours are opponent (so, the titan is captured)
    }

    function captureTitan(nodeId, capturedPlayer) { // ]
        const node = nodes[nodeId]; // ]
        if (!node || node.occupiedBy !== capturedPlayer) return; // Safety check 
        console.log(`Capturing ${capturedPlayer} titan at ${nodeId}`); //Lessgooo!!
        setMessage(`${capturedPlayer}'s titan at ${nodeId} captured!`); // ]
        updateScoresForCapture(nodeId, capturedPlayer); // Deduct score for captured piece's edges 
        // Remove titan from board 
        node.occupiedBy = null; // 
        node.element.classList.remove('red-titan', 'blue-titan'); // 
        // Look, I don't know enough js to add animations
    }

     function updateScoresForCapture(capturedNodeId, capturedPlayer) { // 
         let scoreDelta = 0; // 
         const node = nodes[capturedNodeId]; // 
         node.adjacencies.forEach(adj => { // 
             const neighbor = nodes[adj.nodeId]; // 
             // If neighbor also belonged to captured player, edge was controlled 
             if (neighbor && neighbor.occupiedBy === capturedPlayer) { // 
                 scoreDelta -= adj.weight; // Deduct score 
                 console.log(`Score change (capture): -${adj.weight} for ${capturedPlayer} (lost edge ${capturedNodeId}-${adj.nodeId})`); // ]
             }
         }); // 
         if (scoreDelta !== 0) { // 
             gameState.scores[capturedPlayer] += scoreDelta; // Apply score change 
             console.log(`Total Score Delta for ${capturedPlayer} due to capture: ${scoreDelta}, New Score: ${gameState.scores[capturedPlayer]}`); // ]
         } // 
         updateScoreDisplay(); // 
     } // ]

    // --- Timers --- 
    function startOverallTimer() { // 
        if (overallTimerInterval) clearInterval(overallTimerInterval); // 
        overallTimerInterval = setInterval(() => { // 
            if (isPaused) return; // 
            gameState.overallTimeRemaining--; // 
            updateTimerDisplays(); // 
            if (gameState.overallTimeRemaining <= 0) { // 
                endGame("Whoops! Times up."); // 
            }
        }, 1000); // 
    } // 

    function startTurnTimer() { // 
        if (turnTimerInterval) clearInterval(turnTimerInterval); // 
        gameState.turnTimeRemaining = TURN_TIME_LIMIT; // 
        updateTimerDisplays(); // Show initial time 
        turnTimerInterval = setInterval(() => { // 
             if (isPaused || gameState.gameOver) return; // 
            gameState.turnTimeRemaining--; // 
            updateTimerDisplays(); // 
            if (gameState.turnTimeRemaining <= 0) { // Time up 
                setMessage(`Time up for ${gameState.currentPlayer}! Switching turns.`); // Ice cold, indeed.
                switchPlayer(); // Auto switch 
            }
        }, 1000); // 
    } // ]

    function resetTurnTimer() { //
        if (turnTimerInterval) clearInterval(turnTimerInterval); // 
        startTurnTimer(); // Start new timer
    }

    function clearTimers() { //
        if (overallTimerInterval) clearInterval(overallTimerInterval); // 
        if (turnTimerInterval) clearInterval(turnTimerInterval); // 
        overallTimerInterval = null; // 
        turnTimerInterval = null; // 
    }

    function formatTime(seconds) { // 
        const mins = Math.floor(seconds / 60); // 
        const secs = seconds % 60; // 
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`; // 
    } // ]

    function updateTimerDisplays() { // ]
        overallTimerDisplay.textContent = formatTime(Math.max(0, gameState.overallTimeRemaining)); // 
        turnTimerDisplay.textContent = formatTime(Math.max(0, gameState.turnTimeRemaining)); // 
    }// can't believe I had to type these names out


    // --- Game State Management --- 
    function switchPlayer() { // 
        if (gameState.gameOver) return; // 
        gameState.currentPlayer = gameState.currentPlayer === 'Red' ? 'Blue' : 'Red'; // 
        setMessage(`${gameState.currentPlayer}'s turn.`); // 
        selectedNodeId = null; // Deselect piece 
        clearHighlights(); // 
        resetTurnTimer(); // Start timer for new player 
        if(gameState.phase === 'Placement') { // 
            highlightAvailableNodes(); // Highlight placement nodes if needed 
        }
        updateUI(); // Reflect changes 
    }

    function updateUI() { // 
        // Player Display 
        currentPlayerDisplay.textContent = gameState.currentPlayer; // 
        currentPlayerDisplay.className = gameState.currentPlayer.toLowerCase(); // Class for color 
        // Scores 
        updateScoreDisplay(); // 
        // Phase 
        gamePhaseDisplay.textContent = gameState.phase; // 
        // Timers 
        updateTimerDisplays(); // 
        // Buttons 
        pauseButton.disabled = isPaused || gameState.gameOver; // 
        resumeButton.disabled = !isPaused || gameState.gameOver; // 
        resetButton.disabled = false; // 
        // 
    }

    function setMessage(msg) { // 
        console.log("Message:", msg); // Log for debugging (I mean only for those who make mistakes, right?)
        messageArea.textContent = msg; // 
    } // 

    // --- Win/End Conditions --- 
    function checkWinConditions() { // 
        // Inner circuit full?
        let innerOccupiedCount = 0; // 
        for (const id in nodes) { // 
            if (nodes[id].circuit === 'inner' && nodes[id].occupiedBy) { // 
                innerOccupiedCount++; // 
            } // 
        }
        if (innerOccupiedCount >= 6) { // 
            endGame("Inner circuit fully occupied."); // 
            return true; // **KO**! (meaning game end, btw)
        }
        // Overall timer checked by interval 
        // No legal moves check (skipped)
        return false; // Game goes on.
    }

    function endGame(reason) { // ]
        if (gameState.gameOver) return; // Preventing multiple calls 
        console.log(`Game Over: ${reason}`); // 
        gameState.gameOver = true; // 
        isPaused = true; // Pause game 
        clearTimers(); // 
        // Determine Winner 
        if (gameState.scores.Red > gameState.scores.Blue) gameState.winner = 'Red'; // 
        else if (gameState.scores.Blue > gameState.scores.Red) gameState.winner = 'Blue'; // 
        else gameState.winner = 'Draw'; // 

        let finalMessage = `Game Over! ${reason}. `; // 
        if (gameState.winner === 'Draw') finalMessage += "It's a draw!"; // eh
        else finalMessage += `${gameState.winner} wins!`; // 
        finalMessage += ` (Final Score: Red ${gameState.scores.Red} - Blue ${gameState.scores.Blue})`; 
        setMessage(finalMessage); //
        // Disable interactions ]
        pauseButton.disabled = true; // 
        resumeButton.disabled = true; //
         clearHighlights(); // 
        console.log("Final Game State:", gameState); // 
    } // 

    // --- Control Buttons --- 
    function pauseGame() { 
        if (gameState.gameOver) return; 
        isPaused = true; 
         if (turnTimerInterval) clearInterval(turnTimerInterval); 
         if (overallTimerInterval) clearInterval(overallTimerInterval); 
        setMessage("Game Paused."); // What is the point of the timer system if you can just pause it?
        pauseButton.disabled = true; // idk who is making up these rules.
        resumeButton.disabled = false; 
         clearHighlights(); 
    }

    function resumeGame() { 
        if (gameState.gameOver || !isPaused) return; 
        isPaused = false; 
        startOverallTimer(); 
        startTurnTimer(); 
        setMessage(`${gameState.currentPlayer}'s turn.`); 
        pauseButton.disabled = false; 
        resumeButton.disabled = true; 
         if(gameState.phase === 'Placement') highlightAvailableNodes(); 
    }

    function resetGame() { 
        setMessage("Resetting game..."); 
        initGame(); 
    }

    // --- Event Listeners --- 
    pauseButton.addEventListener('click', pauseGame); 
    resumeButton.addEventListener('click', resumeGame); 
    resetButton.addEventListener('click', resetGame); 

    // --- Start --- 
    initGame(); 

}); 
// ~Fin~
