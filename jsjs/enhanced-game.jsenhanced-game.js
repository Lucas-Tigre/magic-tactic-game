    
    addSpellEffect(spell, caster) {
        const effect = {
            spell: spell,
            caster: caster,
            duration: 60, // frames
            frame: 0
        };
        this.spellEffects.push(effect);
    }
    
    updateSpellEffects() {
        this.spellEffects = this.spellEffects.filter(effect => {
            effect.frame++;
            return effect.frame < effect.duration;
        });
    }
    
    playerDefend() {
        this.setBattleMessage("Você se defendeu e recuperou um pouco de mana!");
        this.player.mp = Math.min(this.player.maxMp, this.player.mp + 5);
        this.updateBattleUI();
        setTimeout(() => this.enemyTurn(), 1500);
    }
    
    playerRun() {
        this.setBattleMessage("Você fugiu da batalha!");
        setTimeout(() => {
            this.gameState = "playing";
            this.showScreen("game-screen");
            this.startGameLoop();
        }, 1500);
    }
    
    enemyTurn() {
        if (this.currentEnemy.hp <= 0) return;
        
        // Simple AI: attack with random spell
        const enemySpells = this.getEnemySpells(this.currentEnemy.element);
        const spell = enemySpells[Math.floor(Math.random() * enemySpells.length)];
        
        // Add enemy spell effect
        this.addSpellEffect(spell, "enemy");
        
        let damage = spell.damage + this.currentEnemy.attack;
        const effectiveness = this.getElementEffectiveness(spell.element, "light"); // Assume player is light element
        damage = Math.floor(damage * effectiveness);
        damage = Math.max(1, damage - this.player.defense);
        
        this.player.hp -= damage;
        
        let message = `${this.currentEnemy.name} usou ${spell.name} e causou ${damage} de dano!`;
        if (effectiveness > 1) message += " É super efetivo!";
        if (effectiveness < 1) message += " Não é muito efetivo...";
        
        this.setBattleMessage(message);
        this.updateBattleUI();
        
        if (this.player.hp <= 0) {
            setTimeout(() => this.gameOver(), 1500);
        } else {
            setTimeout(() => {
                this.battleState = "choosing";
                this.setBattleMessage("Escolha sua ação!");
            }, 1500);
        }
    }
    
    getEnemySpells(element) {
        const spells = {
            fire: [{ name: "Bola de Fogo", element: "fire", damage: 12 }],
            water: [{ name: "Jato de Água", element: "water", damage: 10 }],
            earth: [{ name: "Terremoto", element: "earth", damage: 14 }],
            air: [{ name: "Rajada de Vento", element: "air", damage: 11 }],
            dark: [{ name: "Bola Sombria", element: "dark", damage: 16 }]
        };
        return spells[element] || spells.dark;
    }
    
    getElementEffectiveness(attackElement, defenseElement) {
        if (!this.elementChart[attackElement]) return 1;
        
        if (this.elementChart[attackElement].strong.includes(defenseElement)) {
            return 1.5;
        }
        if (this.elementChart[attackElement].weak.includes(defenseElement)) {
            return 0.75;
        }
        return 1;
    }
    
    enemyDefeated() {
        this.currentEnemy.defeated = true;
        const expGain = 25 + (this.currentEnemy.maxHp / 4);
        this.player.exp += expGain;
        
        this.setBattleMessage(`${this.currentEnemy.name} foi derrotado! Você ganhou ${expGain} EXP!`);
        
        // Check if all regular enemies are defeated
        const allEnemiesDefeated = this.enemies.every(enemy => enemy.defeated);
        if (allEnemiesDefeated && !this.boss.unlocked) {
            this.boss.unlocked = true;
            setTimeout(() => {
                this.setBattleMessage("O caminho para o Rei das Trevas foi liberado!");
            }, 2000);
        }
        
        // Check for level up
        if (this.player.exp >= this.player.expToNext) {
            setTimeout(() => this.levelUp(), 3000);
        } else {
            setTimeout(() => {
                this.gameState = "playing";
                this.showScreen("game-screen");
                this.startGameLoop();
            }, 3000);
        }
        
        // Check for game completion
        if (this.currentEnemy === this.boss) {
            setTimeout(() => this.gameWon(), 3000);
        }
    }
    
    levelUp() {
        this.player.level++;
        this.player.exp -= this.player.expToNext;
        this.player.expToNext = Math.floor(this.player.expToNext * 1.2);
        
        this.showScreen("levelup-screen");
        document.getElementById("new-level").textContent = this.player.level;
        this.resetStatDistribution();
    }
    
    resetStatDistribution() {
        this.statPoints = 3;
        this.tempStats = { hp: 0, mp: 0, attack: 0, defense: 0, speed: 0 };
        document.getElementById("stat-points").textContent = this.statPoints;
        
        // Reset display
        Object.keys(this.tempStats).forEach(stat => {
            document.getElementById(`${stat}-points`).textContent = "0";
        });
        
        // Add event listeners to stat buttons
        document.querySelectorAll(".stat-btn").forEach(btn => {
            btn.replaceWith(btn.cloneNode(true)); // Remove old listeners
        });
        
        document.querySelectorAll(".stat-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const stat = e.target.dataset.stat;
                if (this.statPoints > 0) {
                    this.statPoints--;
                    this.tempStats[stat]++;
                    document.getElementById("stat-points").textContent = this.statPoints;
                    document.getElementById(`${stat}-points`).textContent = this.tempStats[stat];
                }
            });
        });
    }
    
    confirmStatDistribution() {
        // Apply stat increases
        this.player.maxHp += this.tempStats.hp * 10;
        this.player.hp += this.tempStats.hp * 10;
        this.player.maxMp += this.tempStats.mp * 5;
        this.player.mp += this.tempStats.mp * 5;
        this.player.attack += this.tempStats.attack * 2;
        this.player.defense += this.tempStats.defense * 2;
        this.player.speed += this.tempStats.speed;
        
        this.gameState = "playing";
        this.showScreen("game-screen");
        this.startGameLoop();
    }
    
    gameOver() {
        this.showScreen("gameover-screen");
        document.getElementById("gameover-title").textContent = "Game Over";
        document.getElementById("gameover-message").textContent = "Você foi derrotado!";
    }
    
    gameWon() {
        this.showScreen("gameover-screen");
        document.getElementById("gameover-title").textContent = "Vitória!";
        document.getElementById("gameover-title").style.color = "#ffd700";
        document.getElementById("gameover-message").textContent = "Você derrotou o Rei das Trevas e salvou a floresta!";
    }
    
    setBattleMessage(message) {
        document.getElementById("battle-message").textContent = message;
    }
    
    updateUI() {
        // Update HUD
        document.getElementById("player-hp-text").textContent = `${this.player.hp}/${this.player.maxHp}`;
        document.getElementById("player-mp-text").textContent = `${this.player.mp}/${this.player.maxMp}`;
        document.getElementById("player-level").textContent = `Nível: ${this.player.level}`;
        document.getElementById("player-exp").textContent = `EXP: ${this.player.exp}/${this.player.expToNext}`;
        
        // Update bars
        const hpPercent = (this.player.hp / this.player.maxHp) * 100;
        const mpPercent = (this.player.mp / this.player.maxMp) * 100;
        
        document.getElementById("player-hp-bar").style.width = `${hpPercent}%`;
        document.getElementById("player-mp-bar").style.width = `${mpPercent}%`;
    }
    
    updateBattleUI() {
        // Update enemy info
        document.getElementById("enemy-name").textContent = this.currentEnemy.name;
        document.getElementById("enemy-hp-text").textContent = `${this.currentEnemy.hp}/${this.currentEnemy.maxHp}`;
        
        // Update player battle info
        document.getElementById("battle-player-hp-text").textContent = `${this.player.hp}/${this.player.maxHp}`;
        document.getElementById("battle-player-mp-text").textContent = `${this.player.mp}/${this.player.maxMp}`;
        
        // Update bars
        const enemyHpPercent = (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100;
        const playerHpPercent = (this.player.hp / this.player.maxHp) * 100;
        const playerMpPercent = (this.player.mp / this.player.maxMp) * 100;
        
        document.getElementById("enemy-hp-bar").style.width = `${enemyHpPercent}%`;
        document.getElementById("battle-player-hp-bar").style.width = `${playerHpPercent}%`;
        document.getElementById("battle-player-mp-bar").style.width = `${playerMpPercent}%`;
        
        // Update sprites with actual images
        this.updateBattleSprites();
    }
    
    updateBattleSprites() {
        const enemySprite = document.getElementById("enemy-sprite");
        const playerSprite = document.getElementById("player-sprite");
        
        // Clear previous content
        enemySprite.innerHTML = "";
        playerSprite.innerHTML = "";
        
        // Add enemy sprite
        if (this.images.dark_wizard_sprite && this.currentEnemy !== this.boss) {
            const enemyImg = document.createElement("img");
            enemyImg.src = this.images.dark_wizard_sprite.src;
            enemyImg.style.width = "100%";
            enemyImg.style.height = "100%";
            enemySprite.appendChild(enemyImg);
        } else if (this.images.dark_king_sprite && this.currentEnemy === this.boss) {
            const bossImg = document.createElement("img");
            bossImg.src = this.images.dark_king_sprite.src;
            bossImg.style.width = "100%";
            bossImg.style.height = "100%";
            enemySprite.appendChild(bossImg);
        }
        
        // Add player sprite
        if (this.images.player_wizard_sprite) {
            const playerImg = document.createElement("img");
            playerImg.src = this.images.player_wizard_sprite.src;
            playerImg.style.width = "100%";
            playerImg.style.height = "100%";
            playerSprite.appendChild(playerImg);
        }
    }
    
    draw() {
        if (!this.ctx || this.imagesLoaded < this.totalImages) return;
        
        // Clear canvas
        this.ctx.fillStyle = this.getAreaBackgroundColor();
        this.ctx.fillRect(0, 0, 800, 600);
        
        // Draw area-specific background
        this.drawAreaBackground();
        
        // Draw enemies in current area
        this.enemies.forEach(enemy => {
            if (!enemy.defeated && enemy.area === this.currentArea) {
                this.drawEnemy(enemy);
            }
        });
        
        // Draw boss (if unlocked and in correct area)
        if (this.boss.unlocked && !this.boss.defeated && this.currentArea === "dark_lair") {
            this.drawBoss();
        }
        
        // Draw player
        this.drawPlayer();
        
        // Draw spell effects
        this.drawSpellEffects();
    }
    
    getAreaBackgroundColor() {
        switch (this.currentArea) {
            case "forest": return "#228B22";
            case "destroyed": return "#8B4513";
            case "dark_lair": return "#2F2F2F";
            default: return "#228B22";
        }
    }
    
    drawAreaBackground() {
        const tileSize = 32;
        
        switch (this.currentArea) {
            case "forest":
                this.drawTiledBackground("grass_tile", tileSize);
                this.drawRandomTiles("forest_tree_tile", tileSize, 0.1);
                this.drawRandomTiles("rock_tile", tileSize, 0.05);
                break;
            case "destroyed":
                this.drawTiledBackground("barren_ground_tile", tileSize);
                this.drawRandomTiles("dead_tree_tile", tileSize, 0.15);
                break;
            case "dark_lair":
                this.drawTiledBackground("dark_ground_tile", tileSize);
                this.drawRandomTiles("dark_pillar_tile", tileSize, 0.08);
                break;
        }
    }
    
    drawTiledBackground(tileName, tileSize) {
        if (!this.images[tileName]) return;
        
        for (let x = 0; x < 800; x += tileSize) {
            for (let y = 0; y < 600; y += tileSize) {
                this.ctx.drawImage(this.images[tileName], x, y, tileSize, tileSize);
            }
        }
    }
    
    drawRandomTiles(tileName, tileSize, density) {
        if (!this.images[tileName]) return;
        
        for (let x = 0; x < 800; x += tileSize) {
            for (let y = 0; y < 600; y += tileSize) {
                if (Math.random() < density) {
                    this.ctx.drawImage(this.images[tileName], x, y, tileSize, tileSize);
                }
            }
        }
    }
    
    drawPlayer() {
        if (this.images.player_wizard_sprite) {
            this.ctx.drawImage(
                this.images.player_wizard_sprite,
                this.player.x - 16,
                this.player.y - 16,
                32,
                32
            );
        } else {
            // Fallback circle
            this.ctx.fillStyle = "#0000FF";
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, 20, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
    
    drawEnemy(enemy) {
        if (this.images.dark_wizard_sprite) {
            this.ctx.drawImage(
                this.images.dark_wizard_sprite,
                enemy.x - 16,
                enemy.y - 16,
                32,
                32
            );
        } else {
            // Fallback circle
            this.ctx.fillStyle = "#8B0000";
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, 25, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
    
    drawBoss() {
        if (this.images.dark_king_sprite) {
            this.ctx.drawImage(
                this.images.dark_king_sprite,
                this.boss.x - 24,
                this.boss.y - 24,
                48,
                48
            );
        } else {
            // Fallback circle
            this.ctx.fillStyle = "#4B0082";
            this.ctx.beginPath();
            this.ctx.arc(this.boss.x, this.boss.y, 30, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
    
    drawSpellEffects() {
        this.spellEffects.forEach(effect => {
            const alpha = 1 - (effect.frame / effect.duration);
            this.ctx.globalAlpha = alpha;
            
            let effectImage = null;
            switch (effect.spell.element) {
                case "fire":
                    effectImage = this.images.fire_spell_effect;
                    break;
                case "water":
                    effectImage = this.images.water_spell_effect;
                    break;
                case "light":
                    effectImage = this.images.heal_spell_effect;
                    break;
            }
            
            if (effectImage) {
                const x = effect.caster === "player" ? this.player.x - 32 : 400 - 32;
                const y = effect.caster === "player" ? this.player.y - 32 : 300 - 32;
                this.ctx.drawImage(effectImage, x, y, 64, 64);
            }
            
            this.ctx.globalAlpha = 1;
        });
    }
}

// Initialize enhanced game when page loads
document.addEventListener("DOMContentLoaded", () => {
    window.gameInstance = new EnhancedMagicTactic();
});
