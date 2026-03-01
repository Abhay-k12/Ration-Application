    const navItems = document.querySelectorAll('.nav-item');
    const modules = document.querySelectorAll('.module');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // remove active from all nav & modules
            navItems.forEach(n => n.classList.remove('active'));
            modules.forEach(m => m.classList.remove('active'));

            // activate clicked nav
            item.classList.add('active');
            const moduleId = item.dataset.module;
            document.getElementById(moduleId).classList.add('active');
        });
    });

    // ---------- modal functions ----------
    function openComplaintModal(id) {
        // in a real app you would fetch details by id, but we demo with static
        document.getElementById('complaintModal').classList.add('active');
    }
    function openTxnModal(id) {
        document.getElementById('txnModal').classList.add('active');
    }
    function closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    // close modal if clicked outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // form submissions (demo)
    document.getElementById('changePwdForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Password updated (demo).');
    });
    document.getElementById('complaintForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Complaint registered (demo).');
    });

    // mobile menu dummy
    document.querySelector('.mobile-menu')?.addEventListener('click', ()=>{
        alert('Mobile navigation would open');
    });