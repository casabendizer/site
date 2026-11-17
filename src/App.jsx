er:bg-emerald-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.badge && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Boletim mensal pendente" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'home' && (
          <HomeTab
            giras={giras}
            setGiras={setGiras}
            mediums={mediums}
            bebidas={bebidas}
            campanhas={campanhas}
            notificacoes={notificacoes}
            linksImportantes={linksImportantes}
            setLinksImportantes={setLinksImportantes}
            configCasa={configCasa}
            isAdmin={isAdmin}
            canCadastros={canCadastros}
            canBebidas={canBebidas}
            setActiveTab={setActiveTab}
            showToast={showToast}
          />
        )}
        {activeTab === 'mediums' && (
          <MediumsTab
            mediums={mediums}
            setMediums={setMediums}
            currentUser={currentUserProfile}
